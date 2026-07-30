package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CarteiraRepository extends JpaRepository<Carteira, Long> {
    List<Carteira> findByDono(Usuario dono);
}
