package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.Categoria;
import controle_financeiro.backend.model.TipoMovimentacao;
import controle_financeiro.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByUsuario(Usuario usuario);
    List<Categoria> findByUsuarioAndTipo(Usuario usuario, TipoMovimentacao tipo);
}
