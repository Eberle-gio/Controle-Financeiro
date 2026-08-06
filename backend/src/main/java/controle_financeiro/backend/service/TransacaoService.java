
package controle_financeiro.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.beans.factory.annotation.Autowired;
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
import controle_financeiro.backend.exception.BusinessException;
import controle_financeiro.backend.exception.ResourceNotFoundException;
import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.Categoria;
import controle_financeiro.backend.model.MembroCarteira;
import controle_financeiro.backend.model.PapelCarteira;
import controle_financeiro.backend.model.TipoMovimentacao;
import controle_financeiro.backend.model.Transacao;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.CarteiraRepository;
import controle_financeiro.backend.repository.CategoriaRepository;
import controle_financeiro.backend.repository.MembroCarteiraRepository;
import controle_financeiro.backend.repository.TransacaoRepository;
import jakarta.persistence.criteria.Predicate;

@Service
public class TransacaoService {

    @Autowired
    private TransacaoRepository transacaoRepository;

    @Autowired
    private CarteiraService carteiraService;

    @Autowired
    private CarteiraRepository carteiraRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private MembroCarteiraRepository membroCarteiraRepository;

    // Lista paginada de transações com filtros dinâmicos
    public PageResponse<TransactionResponse> listarPaginado(
            Long walletId,
            int page,
            int size,
            String sort,
            LocalDate startDate,
            LocalDate endDate,
            Long categoryId,
            String type,
            Usuario usuario
    ) {
        MembroCarteira vinculo = buscarVinculoOuFalhar(walletId, usuario);

        Sort.Direction direction = Sort.Direction.DESC;
        String property = "data";

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            property = parts[0];
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
    public TransactionResponse buscarPorId(Long walletId, Long id, Usuario usuario) {
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
    public TransactionResponse criar(Long walletId, TransactionRequest request, Usuario usuario) {
        MembroCarteira vinculo = buscarVinculoComPermissaoEscrita(walletId, usuario);

        Categoria categoria = null;
        if (request.getCategoryId() != null) {
            categoria = categoriaRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));
        }

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
    public TransactionResponse atualizar(Long walletId, Long id, TransactionRequest request, Usuario usuario) {
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
    public void excluir(Long walletId, Long id, Usuario usuario) {
        buscarVinculoComPermissaoEscrita(walletId, usuario);

        Transacao transacao = transacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada."));

        if (!transacao.getCarteira().getId().equals(walletId)) {
            throw new ResourceNotFoundException("Transação não pertence a esta carteira.");
        }

        transacaoRepository.delete(transacao);
    }

    // Obter Resumo Consolidado do Dashboard
    public DashboardSummaryResponse obterResumoDashboard(Long walletId, LocalDate inicio, LocalDate fim, Usuario usuario) {
        MembroCarteira vinculo = buscarVinculoOuFalhar(walletId, usuario);
        Carteira carteira = vinculo.getCarteira();

        LocalDate dataInicio = inicio != null ? inicio : LocalDate.now().withDayOfMonth(1);
        LocalDate dataFim = fim != null ? fim : LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

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
            String catName = t.getCategoria() != null ? t.getCategoria().getName() : "Sem Categoria";
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
        if (vinculo.getPapel() == PapelCarteira.VISUALIZADOR) {
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
                .categoryName(t.getCategoria() != null ? t.getCategoria().getName() : "Sem Categoria")
                .categoryColor(t.getCategoria() != null ? t.getCategoria().getCor() : "#6b7280")
                .categoryIcon(t.getCategoria() != null ? t.getCategoria().getIcone() : "Tag")
                .criadoPorId(t.getCriadoPor().getId())
                .criadoPorNome(t.getCriadoPor().getName())
                .data(t.getData())
                .criadoEm(t.getCriadoEm())
                .build();
    }
}
