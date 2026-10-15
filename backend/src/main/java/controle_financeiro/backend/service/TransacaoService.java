package controle_financeiro.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import controle_financeiro.backend.dto.DashboardSummaryResponse;
import controle_financeiro.backend.dto.PageResponse;
import controle_financeiro.backend.dto.TransactionRequest;
import controle_financeiro.backend.dto.TransactionResponse;
import controle_financeiro.backend.exception.ResourceNotFoundException;
import controle_financeiro.backend.exception.BusinessException;
import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.Categoria;
import controle_financeiro.backend.model.MembroCarteira;
import controle_financeiro.backend.model.TipoMovimentacao;
import controle_financeiro.backend.model.TipoPermissao;
import controle_financeiro.backend.model.Transacao;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.CategoriaRepository;
import controle_financeiro.backend.repository.TransacaoRepository;
import jakarta.persistence.criteria.Predicate;

@Service
public class TransacaoService {

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio != null && fim != null && inicio.isAfter(fim)) {
            throw new IllegalArgumentException("A data inicial não pode ser posterior à data final.");
        }
    }

    private void validarCategoria(Categoria categoria, Usuario usuario, TipoMovimentacao tipo, boolean mantida) {
        if (!mantida && !categoria.getUsuario().getId().equals(usuario.getId())) {
            throw new AccessDeniedException("Você não pode selecionar uma categoria de outro usuário.");
        }
        if (categoria.getTipo() != tipo) {
            throw new BusinessException("A categoria deve ter o mesmo tipo da transação.");
        }
    }

    @Autowired
    private TransacaoRepository transacaoRepository;

    @Autowired
    private CarteiraService carteiraService;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Lazy
    @Autowired
    private UsuarioService usuarioService;

    // Lista paginada de transações com filtros dinâmicos
    public PageResponse<TransactionResponse> listarPaginado(
            Long walletId,
            int page,
            int size,
            String sort,
            LocalDate startDate,
            LocalDate endDate,
            Long categoryId,
            String type
    ) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculo = buscarVinculoOuFalhar(walletId, usuario);

        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Página deve ser >= 0 e tamanho deve estar entre 1 e 100.");
        }
        validarPeriodo(startDate, endDate);
        Sort.Direction direction = Sort.Direction.DESC;
        String property = "data";

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            property = parts[0];
            if ("date".equals(property)) property = "data";
            if (!List.of("data", "valor", "descricao", "tipo", "criadoEm", "id").contains(property)
                    || parts.length > 2 || (parts.length > 1
                    && !"asc".equalsIgnoreCase(parts[1]) && !"desc".equalsIgnoreCase(parts[1]))) {
                throw new IllegalArgumentException("Ordenação inválida.");
            }
            if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1])) {
                direction = Sort.Direction.ASC;
            }
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));

        Specification<Transacao> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("carteira"), vinculo.getCarteira()));

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("data"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("data"), endDate));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoria").get("id"), categoryId));
            }
            if (type != null && !type.isBlank()) {
                TipoMovimentacao tipoEnum = TipoMovimentacao.fromString(type);
                predicates.add(cb.equal(root.get("tipo"), tipoEnum));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Transacao> resultadoPage = transacaoRepository.findAll(spec, pageable);

        List<TransactionResponse> content = resultadoPage.getContent().stream()
                .map(this::paraDTO)
                .toList();

        return PageResponse.<TransactionResponse>builder()
                .content(content)
                .page(resultadoPage.getNumber())
                .size(resultadoPage.getSize())
                .totalElements(resultadoPage.getTotalElements())
                .totalPages(resultadoPage.getTotalPages())
                .last(resultadoPage.isLast())
                .build();
    }

    // Busca detalhes de uma transação específica
    public TransactionResponse buscarPorId(Long walletId, Long id) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        buscarVinculoOuFalhar(walletId, usuario);
        Transacao transacao = transacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada."));

        if (!transacao.getCarteira().getId().equals(walletId)) {
            throw new ResourceNotFoundException("Transação não pertence a esta carteira.");
        }

        return paraDTO(transacao);
    }

    // Cria nova transação
    @Transactional
    public TransactionResponse criar(Long walletId, TransactionRequest request) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculo = buscarVinculoComPermissaoEscrita(walletId, usuario);

        Categoria categoria = null;
        if (request.getCategoryId() != null) {
            categoria = categoriaRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));
        }

        if (categoria != null) validarCategoria(categoria, usuario, request.getTipo(), false);
        Transacao transacao = new Transacao();
        transacao.setCarteira(vinculo.getCarteira());
        transacao.setCategoria(categoria);
        transacao.setCriadoPor(usuario);
        transacao.setTipo(request.getTipo());
        transacao.setValor(request.getValor());
        transacao.setDescricao(request.getDescricao());
        transacao.setData(request.getData());

        Transacao salva = transacaoRepository.save(transacao);
        return paraDTO(salva);
    }

    // Atualiza transação
    @Transactional
    public TransactionResponse atualizar(Long walletId, Long id, TransactionRequest request) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        buscarVinculoComPermissaoEscrita(walletId, usuario);

        Transacao transacao = transacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada."));

        if (!transacao.getCarteira().getId().equals(walletId)) {
            throw new ResourceNotFoundException("Transação não pertence a esta carteira.");
        }

        Categoria categoria = null;
        if (request.getCategoryId() != null) {
            categoria = categoriaRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));
        }

        if (categoria != null) {
            boolean mantida = transacao.getCategoria() != null
                    && transacao.getCategoria().getId().equals(categoria.getId());
            validarCategoria(categoria, usuario, request.getTipo(), mantida);
        }
        transacao.setCategoria(categoria);
        transacao.setTipo(request.getTipo());
        transacao.setValor(request.getValor());
        transacao.setDescricao(request.getDescricao());
        transacao.setData(request.getData());

        Transacao salva = transacaoRepository.save(transacao);
        return paraDTO(salva);
    }

    // Exclui transação
    @Transactional
    public void excluir(Long walletId, Long id) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        buscarVinculoComPermissaoEscrita(walletId, usuario);

        Transacao transacao = transacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada."));

        if (!transacao.getCarteira().getId().equals(walletId)) {
            throw new ResourceNotFoundException("Transação não pertence a esta carteira.");
        }

        transacaoRepository.delete(transacao);
    }

    // Resumo do Dashboard
    public DashboardSummaryResponse obterResumoDashboard(Long walletId, LocalDate inicio, LocalDate fim) {
        validarPeriodo(inicio, fim);
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculo = buscarVinculoOuFalhar(walletId, usuario);
        Carteira carteira = vinculo.getCarteira();

        LocalDate dataInicio = inicio != null ? inicio : LocalDate.now().withDayOfMonth(1);
        LocalDate dataFim = fim != null ? fim : LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        validarPeriodo(dataInicio, dataFim);

        List<Transacao> transacoes = transacaoRepository.findByCarteiraAndDataBetweenOrderByDataDesc(carteira, dataInicio, dataFim);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        Map<Long, DashboardSummaryResponse.CategorySummaryDTO> byCategoryMap = new HashMap<>();
        Map<String, DashboardSummaryResponse.DateSummaryDTO> byDateMap = new TreeMap<>();

        for (Transacao t : transacoes) {
            BigDecimal valor = t.getValor();
            if (t.getTipo() == TipoMovimentacao.RECEITA) {
                totalIncome = totalIncome.add(valor);
            } else {
                totalExpense = totalExpense.add(valor);
            }

            // Agrupamento por Categoria
            Long catId = t.getCategoria() != null ? t.getCategoria().getId() : 0L;
            String catName = t.getCategoria() != null ? t.getCategoria().getNome() : "Sem Categoria";
            String catColor = t.getCategoria() != null ? t.getCategoria().getCor() : "#6b7280";
            String catIcon = t.getCategoria() != null ? t.getCategoria().getIcone() : "Tag";

            byCategoryMap.putIfAbsent(catId, new DashboardSummaryResponse.CategorySummaryDTO(catId, catName, catColor, catIcon, BigDecimal.ZERO));
            DashboardSummaryResponse.CategorySummaryDTO catDto = byCategoryMap.get(catId);
            catDto.setTotal(catDto.getTotal().add(valor));

            // Agrupamento por Data
            String dateKey = t.getData().toString();
            byDateMap.putIfAbsent(dateKey, new DashboardSummaryResponse.DateSummaryDTO(dateKey, BigDecimal.ZERO, BigDecimal.ZERO));
            DashboardSummaryResponse.DateSummaryDTO dateDto = byDateMap.get(dateKey);
            if (t.getTipo() == TipoMovimentacao.RECEITA) {
                dateDto.setReceitas(dateDto.getReceitas().add(valor));
            } else {
                dateDto.setDespesas(dateDto.getDespesas().add(valor));
            }
        }

        BigDecimal balance = totalIncome.subtract(totalExpense);

        List<TransactionResponse> recent = transacoes.stream()
                .limit(10)
                .map(this::paraDTO)
                .toList();

        return DashboardSummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .transactionCount(transacoes.size())
                .byCategory(new ArrayList<>(byCategoryMap.values()))
                .byDate(new ArrayList<>(byDateMap.values()))
                .recentTransactions(recent)
                .build();
    }

    private MembroCarteira buscarVinculoOuFalhar(Long walletId, Usuario usuario) {
        return carteiraService.buscarVinculoOuFalhar(walletId, usuario);
    }

    private MembroCarteira buscarVinculoComPermissaoEscrita(Long walletId, Usuario usuario) {
        MembroCarteira vinculo = buscarVinculoOuFalhar(walletId, usuario);
        if (vinculo.getPapel() == TipoPermissao.VISUALIZADOR) {
            throw new AccessDeniedException("Você não tem permissão para modificar transações nesta carteira.");
        }
        return vinculo;
    }

    private TransactionResponse paraDTO(Transacao t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .walletId(t.getCarteira().getId())
                .descricao(t.getDescricao())
                .valor(t.getValor())
                .tipo(t.getTipo())
                .categoryId(t.getCategoria() != null ? t.getCategoria().getId() : null)
                .categoryName(t.getCategoria() != null ? t.getCategoria().getNome() : "Sem Categoria")
                .categoryColor(t.getCategoria() != null ? t.getCategoria().getCor() : "#6b7280")
                .categoryIcon(t.getCategoria() != null ? t.getCategoria().getIcone() : "Tag")
                .criadoPorId(t.getCriadoPor().getId())
                .criadoPorNome(t.getCriadoPor().getNome())
                .data(t.getData())
                .criadoEm(t.getCriadoEm())
                .build();
    }
}
