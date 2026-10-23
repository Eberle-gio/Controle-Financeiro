package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface ConviteCarteiraRepository extends JpaRepository<ConviteCarteira, Long> {
    Optional<ConviteCarteira> findByCarteiraAndEmail(Carteira carteira, String email);
    Optional<ConviteCarteira> findByTokenHash(String hash);

    @Query("select c.carteira.id from ConviteCarteira c where c.tokenHash = :hash")
    Optional<Long> buscarCarteiraIdPorHash(@Param("hash") String hash);
    List<ConviteCarteira> findByCarteiraOrderByEnviadoEmDesc(Carteira carteira);
    void deleteByCarteira(Carteira carteira);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ConviteCarteira c where c.tokenHash = :hash")
    Optional<ConviteCarteira> buscarComBloqueio(@Param("hash") String hash);
}
