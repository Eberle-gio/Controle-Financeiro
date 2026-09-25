package controle_financeiro.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import controle_financeiro.backend.dto.WalletMemberRequest;
import controle_financeiro.backend.dto.WalletMemberResponse;
import controle_financeiro.backend.dto.WalletRequest;
import controle_financeiro.backend.dto.WalletResponse;
import controle_financeiro.backend.exception.BusinessException;
import controle_financeiro.backend.exception.ResourceNotFoundException;
import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.MembroCarteira;
import controle_financeiro.backend.model.TipoPermissao;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.CarteiraRepository;
import controle_financeiro.backend.repository.MembroCarteiraRepository;
import controle_financeiro.backend.repository.UsuarioRepository;

@Service
public class CarteiraService {

    @Autowired
    private CarteiraRepository carteiraRepository;

    @Autowired
    private MembroCarteiraRepository membroCarteiraRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Lazy
    @Autowired
    private UsuarioService usuarioService;

    // Lista todas as carteiras onde o usuário logado é membro ou dono
    public List<WalletResponse> listarCarteirasDoUsuario() {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        List<MembroCarteira> vinculos = membroCarteiraRepository.findByUsuario(usuario);
        return vinculos.stream()
                .map(vinculo -> paraWalletResponse(vinculo.getCarteira(), vinculo.getPapel()))
                .toList();
    }

    // Busca detalhes de uma carteira específica
    public WalletResponse buscarPorId(Long id) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculo = buscarVinculoOuFalhar(id, usuario);
        return paraWalletResponse(vinculo.getCarteira(), vinculo.getPapel());
    }

    // Cria nova carteira e define o usuário como DONO
    @Transactional
    public WalletResponse criarCarteira(WalletRequest request) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        Carteira carteira = new Carteira();
        carteira.setDono(usuario);
        carteira.setNome(request.getNome());
        carteira.setDescricao(request.getDescricao());

        Carteira salva = carteiraRepository.save(carteira);

        MembroCarteira membroDono = new MembroCarteira();
        membroDono.setCarteira(salva);
        membroDono.setUsuario(usuario);
        membroDono.setPapel(TipoPermissao.DONO);
        membroCarteiraRepository.save(membroDono);

        return paraWalletResponse(salva, TipoPermissao.DONO);
    }

    // Atualiza nome/descrição da carteira 
    @Transactional
    public WalletResponse atualizarCarteira(Long id, WalletRequest request) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculo = buscarVinculoOuFalhar(id, usuario);

        if (vinculo.getPapel() == TipoPermissao.VISUALIZADOR) {
            throw new AccessDeniedException("Você não tem permissão de edição nesta carteira.");
        }

        Carteira carteira = vinculo.getCarteira();
        carteira.setNome(request.getNome());
        carteira.setDescricao(request.getDescricao());

        Carteira salva = carteiraRepository.save(carteira);
        return paraWalletResponse(salva, vinculo.getPapel());
    }

    // Exclui carteira e seus membros 
    @Transactional
    public void excluirCarteira(Long id) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculo = buscarVinculoOuFalhar(id, usuario);

        if (vinculo.getPapel() != TipoPermissao.DONO) {
            throw new AccessDeniedException("Apenas o dono da carteira pode excluí-la.");
        }

        membroCarteiraRepository.deleteByCarteira(vinculo.getCarteira());
        carteiraRepository.delete(vinculo.getCarteira());
    }

    // GESTÃO DE MEMBROS DA CARTEIRA
    // Lista membros da carteira
    public List<WalletMemberResponse> listarMembros(Long carteiraId) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculo = buscarVinculoOuFalhar(carteiraId, usuario);
        List<MembroCarteira> membros = membroCarteiraRepository.findByCarteira(vinculo.getCarteira());
        return membros.stream()
                .map(this::paraMemberResponse)
                .toList();
    }

    // Adiciona novo membro por e-mail (somente DONO)
    @Transactional
    public WalletMemberResponse adicionarMembro(Long carteiraId, WalletMemberRequest request) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculoDono = buscarVinculoOuFalhar(carteiraId, usuario);

        if (vinculoDono.getPapel() != TipoPermissao.DONO) {
            throw new AccessDeniedException("Apenas o dono da carteira pode adicionar membros.");
        }

        String emailNormalizado = controle_financeiro.backend.util.EmailUtils.normalizar(request.getEmail());
        Usuario novoMembroUsuario = usuarioRepository.findByEmail(emailNormalizado);
        if (novoMembroUsuario == null) {
            throw new ResourceNotFoundException("Usuário com o e-mail informado não foi encontrado.");
        }

        Carteira carteira = vinculoDono.getCarteira();

        if (membroCarteiraRepository.existsByCarteiraAndUsuario(carteira, novoMembroUsuario)) {
            throw new DataIntegrityViolationException("O usuário já é membro desta carteira.");
        }

        TipoPermissao papel = request.getPapel() != null ? request.getPapel() : TipoPermissao.EDITOR;

        MembroCarteira novoMembro = new MembroCarteira();
        novoMembro.setCarteira(carteira);
        novoMembro.setUsuario(novoMembroUsuario);
        novoMembro.setPapel(papel);

        MembroCarteira salvo = membroCarteiraRepository.save(novoMembro);
        return paraMemberResponse(salvo);
    }

    // Altera o papel de um membro (somente DONO)
    @Transactional
    public WalletMemberResponse alterarPapelMembro(Long carteiraId, Long membroUsuarioId, TipoPermissao novoPapel) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculoDono = buscarVinculoOuFalhar(carteiraId, usuario);

        if (vinculoDono.getPapel() != TipoPermissao.DONO) {
            throw new AccessDeniedException("Apenas o dono da carteira pode alterar papéis dos membros.");
        }

        Usuario alvoUsuario = usuarioRepository.findById(membroUsuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        MembroCarteira alvoVinculo = membroCarteiraRepository.findByCarteiraAndUsuario(vinculoDono.getCarteira(), alvoUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("O usuário não é membro desta carteira."));

        if (alvoVinculo.getPapel() == TipoPermissao.DONO) {
            throw new BusinessException("O papel do dono da carteira não pode ser alterado.");
        }

        alvoVinculo.setPapel(novoPapel);
        MembroCarteira salvo = membroCarteiraRepository.save(alvoVinculo);
        return paraMemberResponse(salvo);
    }

    // Remove um membro da carteira (somente DONO ou o próprio membro saindo)
    @Transactional
    public void removerMembro(Long carteiraId, Long membroUsuarioId) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        MembroCarteira vinculoSolicitante = buscarVinculoOuFalhar(carteiraId, usuario);

        boolean ehODono = vinculoSolicitante.getPapel() == TipoPermissao.DONO;
        boolean ehOSroprioMembro = usuario.getId().equals(membroUsuarioId);

        if (!ehODono && !ehOSroprioMembro) {
            throw new AccessDeniedException("Você não tem permissão para remover este membro.");
        }

        Usuario alvoUsuario = usuarioRepository.findById(membroUsuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        MembroCarteira alvoVinculo = membroCarteiraRepository.findByCarteiraAndUsuario(vinculoSolicitante.getCarteira(), alvoUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("O usuário não é membro desta carteira."));

        if (alvoVinculo.getPapel() == TipoPermissao.DONO) {
            throw new BusinessException("O dono da carteira não pode ser removido.");
        }

        membroCarteiraRepository.delete(alvoVinculo);
    }

    // Método utilitário para validar vinculo do usuário com a carteira
    public MembroCarteira buscarVinculoOuFalhar(Long carteiraId, Usuario usuario) {
        Carteira carteira = carteiraRepository.findById(carteiraId)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada."));

        return membroCarteiraRepository.findByCarteiraAndUsuario(carteira, usuario)
                .orElseThrow(() -> new AccessDeniedException("Você não tem acesso a esta carteira."));
    }

    private WalletResponse paraWalletResponse(Carteira c, TipoPermissao meuPapel) {
        return WalletResponse.builder()
                .id(c.getId())
                .nome(c.getNome())
                .descricao(c.getDescricao())
                .donoId(c.getDono().getId())
                .donoNome(c.getDono().getNome())
                .meuPapel(meuPapel)
                .criadoEm(c.getCriadoEm())
                .build();
    }

    private WalletMemberResponse paraMemberResponse(MembroCarteira m) {
        return WalletMemberResponse.builder()
                .id(m.getId())
                .usuarioId(m.getUsuario().getId())
                .usuarioNome(m.getUsuario().getNome())
                .usuarioEmail(m.getUsuario().getEmail())
                .papel(m.getPapel())
                .entradoEm(m.getEntradoEm())
                .build();
    }
}
