package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import controle_financeiro.backend.model.Usuario;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    boolean existsByTokenAndUtilizadoTrue(String token);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update PasswordResetToken t set t.utilizado = true where t.usuario = :usuario and t.utilizado = false")
    int invalidarTodos(@Param("usuario") Usuario usuario);
}
