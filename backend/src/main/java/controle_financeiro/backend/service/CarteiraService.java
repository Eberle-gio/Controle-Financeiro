package controle_financeiro.backend.service;

import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.MembroCarteira;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.CarteiraRepository;
import controle_financeiro.backend.repository.MembroCarteiraRepository;
import controle_financeiro.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CarteiraService {

    @Autowired
    private CarteiraRepository carteiraRepository;

    @Autowired
    private MembroCarteiraRepository membroCarteiraRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Cria uma nova carteira e já vincula o criador como DONO
    public Carteira criarCarteira(Carteira carteira, Long usuarioId) {
        Usuario dono = usuarioRepository.findById(usuarioId).orElse(null);
        if (dono == null) {
            throw new RuntimeException("Usuário não encontrado.");
        }

        carteira.setDono(dono);
        Carteira carteiraSalva = carteiraRepository.save(carteira);

        // Adiciona automaticamente o criador como DONO na tabela de membros
        MembroCarteira membro = new MembroCarteira();
        membro.setCarteira(carteiraSalva);
        membro.setUsuario(dono);
        membro.setPapel("DONO");
        membroCarteiraRepository.save(membro);

        return carteiraSalva;
    }

    // Retorna todas as carteiras onde o usuário é membro (DONO ou MEMBRO)
    public List<Carteira> listarCarteirasPorUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuário não encontrado.");
        }

        List<MembroCarteira> membros = membroCarteiraRepository.findByUsuario(usuario);
        return membros.stream()
                .map(MembroCarteira::getCarteira)
                .toList();
    }

    // Busca uma carteira pelo ID e verifica se o usuário é membro
    public Carteira buscarCarteiraPorId(Long carteiraId, Long usuarioId) {
        Carteira carteira = carteiraRepository.findById(carteiraId).orElse(null);
        if (carteira == null) {
            throw new RuntimeException("Carteira não encontrada.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null || !membroCarteiraRepository.existsByCarteiraAndUsuario(carteira, usuario)) {
            throw new RuntimeException("Acesso negado: usuário não é membro desta carteira.");
        }

        return carteira;
    }
}
