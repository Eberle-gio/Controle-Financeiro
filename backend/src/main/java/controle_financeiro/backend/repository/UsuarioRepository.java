package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Usuario findByEmail(String email);

    // FOR UPDATE sem lista de aliases funciona em MySQL e MariaDB.
    @Query(value = "select * from usuarios where email = :email for update", nativeQuery = true)
    Optional<Usuario> buscarParaConfirmacaoPorEmail(@Param("email") String email);

    @Query(value = "select * from usuarios where confirmacao_token_hash = :hash for update", nativeQuery = true)
    Optional<Usuario> buscarPorConfirmacaoToken(@Param("hash") String hash);
}
