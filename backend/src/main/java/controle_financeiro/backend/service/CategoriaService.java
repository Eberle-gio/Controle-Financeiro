package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.CategoryRequest;
import controle_financeiro.backend.dto.CategoryResponse;
import controle_financeiro.backend.exception.BusinessException;
import controle_financeiro.backend.exception.ResourceNotFoundException;
import controle_financeiro.backend.model.Categoria;
import controle_financeiro.backend.model.TipoMovimentacao;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.CategoriaRepository;
import controle_financeiro.backend.repository.TransacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private TransacaoRepository transacaoRepository;

    // Cria as categorias padrão automaticamente quando um novo usuário se cadastra
    @Transactional
    public void criarCategoriasPadrao(Usuario usuario) {
        List<Categoria> categoriasPadrao = List.of(
            criarCategoriaObject(usuario, "Salário",       TipoMovimentacao.RECEITA, "#10b981", "Briefcase"),
            criarCategoriaObject(usuario, "Investimentos", TipoMovimentacao.RECEITA, "#3b82f6", "TrendingUp"),
            criarCategoriaObject(usuario, "Alimentação",   TipoMovimentacao.DESPESA, "#f59e0b", "UtensilsCrossed"),
            criarCategoriaObject(usuario, "Transporte",    TipoMovimentacao.DESPESA, "#6366f1", "Car"),
            criarCategoriaObject(usuario, "Moradia",       TipoMovimentacao.DESPESA, "#ef4444", "House"),
            criarCategoriaObject(usuario, "Lazer",         TipoMovimentacao.DESPESA, "#ec4899", "PartyPopper")
        );
        categoriaRepository.saveAll(categoriasPadrao);
    }

    // Lista todas as categorias do usuário autenticado (com filtro opcional de tipo)
    public List<CategoryResponse> listarPorUsuario(Usuario usuario, String tipo) {
        List<Categoria> categorias;

        if (tipo != null && !tipo.isBlank()) {
            TipoMovimentacao tipoEnum = parseTipoMovimentacao(tipo);
            categorias = categoriaRepository.findByUsuarioAndTipo(usuario, tipoEnum);
        } else {
            categorias = categoriaRepository.findByUsuario(usuario);
        }

        return categorias.stream()
                .map(this::paraDTO)
                .toList();
    }

    // Cria uma nova categoria personalizada para o usuário autenticado
    @Transactional
    public CategoryResponse criar(CategoryRequest request, Usuario usuario) {
        Categoria categoria = new Categoria();
        categoria.setUsuario(usuario);
        categoria.setName(request.getName());
        categoria.setTipo(request.getTipo());
        categoria.setCor(request.getCor());
        categoria.setIcone(request.getIcone());

        Categoria salva = categoriaRepository.save(categoria);
        return paraDTO(salva);
    }

    // Atualiza dados de uma categoria do usuário autenticado
    @Transactional
    public CategoryResponse atualizar(Long id, CategoryRequest request, Usuario usuario) {
        Categoria categoria = buscarEntityPorIdEUsuario(id, usuario);

        categoria.setName(request.getName());
        categoria.setTipo(request.getTipo());
        categoria.setCor(request.getCor());
        categoria.setIcone(request.getIcone());

        Categoria salva = categoriaRepository.save(categoria);
        return paraDTO(salva);
    }

    // Remove uma categoria (lança HTTP 422 se houver transações vinculadas)
    @Transactional
    public void excluir(Long id, Usuario usuario) {
        Categoria categoria = buscarEntityPorIdEUsuario(id, usuario);

        if (transacaoRepository.existsByCategoriaId(id)) {
            throw new BusinessException("Não é possível excluir uma categoria que possui transações vinculadas.");
        }

        categoriaRepository.delete(categoria);
    }

    private Categoria buscarEntityPorIdEUsuario(Long id, Usuario usuario) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));

        if (!categoria.getUsuario().getId().equals(usuario.getId())) {
            throw new AccessDeniedException("Você não tem permissão para acessar esta categoria.");
        }

        return categoria;
    }

    private Categoria criarCategoriaObject(Usuario usuario, String name, TipoMovimentacao tipo, String cor, String icone) {
        Categoria c = new Categoria();
        c.setUsuario(usuario);
        c.setName(name);
        c.setTipo(tipo);
        c.setCor(cor);
        c.setIcone(icone);
        return c;
    }

    private CategoryResponse paraDTO(Categoria c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .tipo(c.getTipo())
                .cor(c.getCor())
                .icone(c.getIcone())
                .build();
    }

    private TipoMovimentacao parseTipoMovimentacao(String tipoStr) {
        String normalizado = tipoStr.toUpperCase();
        if ("INCOME".equals(normalizado)) return TipoMovimentacao.RECEITA;
        if ("EXPENSE".equals(normalizado)) return TipoMovimentacao.DESPESA;
        try {
            return TipoMovimentacao.valueOf(normalizado);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Tipo inválido. Use INCOME, EXPENSE, RECEITA ou DESPESA.");
        }
    }
}
