package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.exception.BusinessException;
import controle_financeiro.backend.exception.ResourceNotFoundException;
import controle_financeiro.backend.model.*;
import controle_financeiro.backend.repository.CarteiraRepository;
import controle_financeiro.backend.repository.MembroCarteiraRepository;
import controle_financeiro.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CarteiraService {

    @Autowired
    private CarteiraRepository carteiraRepository;

    @Autowired
    private MembroCarteiraRepository membroCarteiraRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Lista todas as carteiras onde o usuário logado é membro ou dono
    public List<WalletResponse> listarCarteirasDoUsuario(Usuario usuario) {
        List<MembroCarteira> vinculos = membroCarteiraRepository.findByUsuario(usuario);
        return vinculos.stream()
                .map(vinculo -> paraWalletResponse(vinculo.getCarteira(), vinculo.getPapel()))
                .toList();
    }

    // Busca detalhes de uma carteira específica
    public WalletResponse buscarPorId(Long id, Usuario usuario) {
        MembroCarteira vinculo = buscarVinculoOuFalhar(id, usuario);
        return paraWalletResponse(vinculo.getCarteira(), vinculo.getPapel());
    }

    // Cria nova carteira e define o usuário como DONO
    @Transactional
    public WalletResponse criarCarteira(WalletRequest request, Usuario usuario) {
        Carteira carteira = new Carteira();
        carteira.setDono(usuario);
        carteira.setNome(request.getNome());
        carteira.setDescricao(request.getDescricao());

        Carteira salva = carteiraRepository.save(carteira);

        MembroCarteira membroDono = new MembroCarteira();
        membroDono.setCarteira(salva);
        membroDono.setUsuario(usuario);
        membroDono.setPapel(PapelCarteira.DONO);
        membroCarteiraRepository.save(membroDono);

        return paraWalletResponse(salva, PapelCarteira.DONO);
    }

    // Atualiza nome/descrição da carteira (somente DONO ou EDITOR)
    @Transactional
    public WalletResponse atualizarCarteira(Long id, WalletRequest request, Usuario usuario) {
        MembroCarteira vinculo = buscarVinculoOuFalhar(id, usuario);

        if (vinculo.getPapel() == PapelCarteira.VISUALIZADOR) {
            throw new AccessDeniedException("Você não tem permissão de edição nesta carteira.");
        }

        Carteira carteira = vinculo.getCarteira();
        carteira.setNome(request.getNome());
        carteira.setDescricao(request.getDescricao());

        Carteira salva = carteiraRepository.save(carteira);
        return paraWalletResponse(salva, vinculo.getPapel());
    }

    // Exclui carteira e seus membros (somente DONO)
    @Transactional
    public void excluirCarteira(Long id, Usuario usuario) {
        MembroCarteira vinculo = buscarVinculoOuFalhar(id, usuario);

        if (vinculo.getPapel() != PapelCarteira.DONO) {
            throw new AccessDeniedException("Apenas o dono da carteira pode excluí-la.");
        }

        membroCarteiraRepository.deleteByCarteira(vinculo.getCarteira());
        carteiraRepository.delete(vinculo.getCarteira());
    }

    // ==========================================
    // GESTÃO DE MEMBROS DA CARTEIRA
    // ==========================================

    // Lista membros da carteira
    public List<WalletMemberResponse> listarMembros(Long carteiraId, Usuario usuario) {
        MembroCarteira vinculo = buscarVinculoOuFalhar(carteiraId, usuario);
        List<MembroCarteira> membros = membroCarteiraRepository.findByCarteira(vinculo.getCarteira());
        return membros.stream()
                .map(this::paraMemberResponse)
                .toList();
    }

    // Adiciona novo membro por e-mail (somente DONO)
    @Transactional
    public WalletMemberResponse adicionarMembro(Long carteiraId, WalletMemberRequest request, Usuario usuario) {
        MembroCarteira vinculoDono = buscarVinculoOuFalhar(carteiraId, usuario);

        if (vinculoDono.getPapel() != PapelCarteira.DONO) {
            throw new AccessDeniedException("Apenas o dono da carteira pode adicionar membros.");
        }

        Usuario novoMembroUsuario = usuarioRepository.findByEmail(request.getEmail());
        if (novoMembroUsuario == null) {
            throw new ResourceNotFoundException("Usuário com o e-mail informado não foi encontrado.");
        }

        Carteira carteira = vinculoDono.getCarteira();

        if (membroCarteiraRepository.existsByCarteiraAndUsuario(carteira, novoMembroUsuario)) {
            throw new DataIntegrityViolationException("O usuário já é membro desta carteira.");
        }

        PapelCarteira papel = request.getPapel() != null ? request.getPapel() : PapelCarteira.EDITOR;

        MembroCarteira novoMembro = new MembroCarteira();
        novoMembro.setCarteira(carteira);
        novoMembro.setUsuario(novoMembroUsuario);
        novoMembro.setPapel(papel);

        MembroCarteira salvo = membroCarteiraRepository.save(novoMembro);
        return paraMemberResponse(salvo);
    }

    // Altera o papel de um membro (somente DONO)
    @Transactional
    public WalletMemberResponse alterarPapelMembro(Long carteiraId, Long membroUsuarioId, PapelCarteira novoPapel, Usuario usuario) {
        MembroCarteira vinculoDono = buscarVinculoOuFalhar(carteiraId, usuario);

        if (vinculoDono.getPapel() != PapelCarteira.DONO) {
            throw new AccessDeniedException("Apenas o dono da carteira pode alterar papéis dos membros.");
        }

        Usuario alvoUsuario = usuarioRepository.findById(membroUsuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        MembroCarteira alvoVinculo = membroCarteiraRepository.findByCarteiraAndUsuario(vinculoDono.getCarteira(), alvoUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("O usuário não é membro desta carteira."));

        if (alvoVinculo.getPapel() == PapelCarteira.DONO) {
            throw new BusinessException("O papel do dono da carteira não pode ser alterado.");
        }

        alvoVinculo.setPapel(novoPapel);
        MembroCarteira salvo = membroCarteiraRepository.save(alvoVinculo);
        return paraMemberResponse(salvo);
    }

    // Remove um membro da carteira (somente DONO ou o próprio membro saindo)
    @Transactional
    public void removerMembro(Long carteiraId, Long membroUsuarioId, Usuario usuario) {
        MembroCarteira vinculoSolicitante = buscarVinculoOuFalhar(carteiraId, usuario);

        boolean ehODono = vinculoSolicitante.getPapel() == PapelCarteira.DONO;
        boolean ehOSroprioMembro = usuario.getId().equals(membroUsuarioId);

        if (!ehODono && !ehOSroprioMembro) {
            throw new AccessDeniedException("Você não tem permissão para remover este membro.");
        }

        Usuario alvoUsuario = usuarioRepository.findById(membroUsuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        MembroCarteira alvoVinculo = membroCarteiraRepository.findByCarteiraAndUsuario(vinculoSolicitante.getCarteira(), alvoUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("O usuário não é membro desta carteira."));

        if (alvoVinculo.getPapel() == PapelCarteira.DONO) {
            throw new BusinessException("O dono da carteira não pode ser removido.");
        }

        membroCarteiraRepository.delete(alvoVinculo);
    }

    // Método utilitário para validar vinculo do usuário com a carteira
    private MembroCarteira buscarVinculoOuFalhar(Long carteiraId, Usuario usuario) {
        Carteira carteira = carteiraRepository.findById(carteiraId)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada."));

        return membroCarteiraRepository.findByCarteiraAndUsuario(carteira, usuario)
                .orElseThrow(() -> new AccessDeniedException("Você não tem acesso a esta carteira."));
    }

    private WalletResponse paraWalletResponse(Carteira c, PapelCarteira meuPapel) {
        return WalletResponse.builder()
                .id(c.getId())
                .nome(c.getNome())
                .descricao(c.getDescricao())
                .donoId(c.getDono().getId())
                .donoNome(c.getDono().getName())
                .meuPapel(meuPapel)
                .criadoEm(c.getCriadoEm())
                .build();
    }

    private WalletMemberResponse paraMemberResponse(MembroCarteira m) {
        return WalletMemberResponse.builder()
                .id(m.getId())
                .usuarioId(m.getUsuario().getId())
                .usuarioNome(m.getUsuario().getName())
                .usuarioEmail(m.getUsuario().getEmail())
                .papel(m.getPapel())
                .entradoEm(m.getEntradoEm())
                .build();
    }
}
