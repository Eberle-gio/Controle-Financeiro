package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CarteiraRepository extends JpaRepository<Carteira, Long> {
    List<Carteira> findByDono(Usuario dono);
    List<Carteira> findByDonoAndAtivaTrue(Usuario dono);

    @org.springframework.data.jpa.repository.Query(value = "select * from carteiras where id = :id for update", nativeQuery = true)
    java.util.Optional<Carteira> buscarComBloqueio(@org.springframework.data.repository.query.Param("id") Long id);
}
