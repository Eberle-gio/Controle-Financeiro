package controle_financeiro.backend.service;

import controle_financeiro.backend.model.Categoria;
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
            criarCategoria(usuario, "Salário",       "RECEITA", "#10b981", "💼"),
            criarCategoria(usuario, "Investimentos", "RECEITA", "#3b82f6", "📈"),
            criarCategoria(usuario, "Alimentação",   "DESPESA", "#f59e0b", "🍔"),
            criarCategoria(usuario, "Transporte",    "DESPESA", "#6366f1", "🚗"),
            criarCategoria(usuario, "Moradia",       "DESPESA", "#ef4444", "🏠"),
            criarCategoria(usuario, "Lazer",         "DESPESA", "#ec4899", "🎉")
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
            return categoriaRepository.findByUsuarioAndTipo(usuario, tipo.toUpperCase());
        }
        return categoriaRepository.findByUsuario(usuario);
    }

    // Auxiliar para montar objeto Categoria
    private Categoria criarCategoria(Usuario usuario, String name, String tipo, String cor, String icone) {
        Categoria c = new Categoria();
        c.setUsuario(usuario);
        c.setName(name);
        c.setTipo(tipo);
        c.setCor(cor);
        c.setIcone(icone);
        return c;
    }
}
