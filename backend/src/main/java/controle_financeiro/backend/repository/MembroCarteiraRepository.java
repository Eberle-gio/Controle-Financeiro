package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.MembroCarteira;
import controle_financeiro.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MembroCarteiraRepository extends JpaRepository<MembroCarteira, Long> {
    List<MembroCarteira> findByUsuario(Usuario usuario);
    List<MembroCarteira> findByCarteira(Carteira carteira);
    boolean existsByCarteiraAndUsuario(Carteira carteira, Usuario usuario);
}
