package controle_financeiro.backend.service;

import controle_financeiro.backend.model.Categoria;
import controle_financeiro.backend.model.TipoMovimentacao;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.CategoriaRepository;
import controle_financeiro.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Cria as categorias padrão automaticamente quando um usuário se cadastra
    public void criarCategoriasPadrao(Usuario usuario) {
        List<Categoria> categoriasPadrao = List.of(
            criarCategoria(usuario, "Salário",       TipoMovimentacao.RECEITA, "#10b981", "Briefcase"),
            criarCategoria(usuario, "Investimentos", TipoMovimentacao.RECEITA, "#3b82f6", "TrendingUp"),
            criarCategoria(usuario, "Alimentação",   TipoMovimentacao.DESPESA, "#f59e0b", "UtensilsCrossed"),
            criarCategoria(usuario, "Transporte",    TipoMovimentacao.DESPESA, "#6366f1", "Car"),
            criarCategoria(usuario, "Moradia",       TipoMovimentacao.DESPESA, "#ef4444", "House"),
            criarCategoria(usuario, "Lazer",         TipoMovimentacao.DESPESA, "#ec4899", "PartyPopper")
        );
        categoriaRepository.saveAll(categoriasPadrao);
    }

    // Cria uma nova categoria personalizada para o usuário
    public Categoria criar(Categoria categoria, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuário não encontrado.");
        }
        categoria.setUsuario(usuario);
        return categoriaRepository.save(categoria);
    }

    // Lista todas as categorias do usuário (opcionalmente filtradas por tipo)
    public List<Categoria> listarPorUsuario(Long usuarioId, String tipo) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuário não encontrado.");
        }

        if (tipo != null && !tipo.isBlank()) {
            TipoMovimentacao tipoEnum = TipoMovimentacao.valueOf(tipo.toUpperCase());
            return categoriaRepository.findByUsuarioAndTipo(usuario, tipoEnum);
        }
        return categoriaRepository.findByUsuario(usuario);
    }

    // Auxiliar para montar objeto Categoria
    private Categoria criarCategoria(Usuario usuario, String name, TipoMovimentacao tipo, String cor, String icone) {
        Categoria c = new Categoria();
        c.setUsuario(usuario);
        c.setName(name);
        c.setTipo(tipo);
        c.setCor(cor);
        c.setIcone(icone);
        return c;
    }
}
