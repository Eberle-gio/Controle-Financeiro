package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.exception.*;
import controle_financeiro.backend.model.*;
import controle_financeiro.backend.repository.*;
import controle_financeiro.backend.util.EmailUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service
public class ConviteCarteiraService {
    private final ConviteCarteiraRepository convites;
    private final CarteiraRepository carteiras;
    private final MembroCarteiraRepository membros;
    private final UsuarioRepository usuarios;
    private final UsuarioService usuarioService;
    private final ApplicationEventPublisher events;
    private final String frontendUrl;
    private static final SecureRandom RANDOM = new SecureRandom();

    public ConviteCarteiraService(ConviteCarteiraRepository convites, CarteiraRepository carteiras,
            MembroCarteiraRepository membros, UsuarioRepository usuarios, UsuarioService usuarioService,
            ApplicationEventPublisher events, @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.convites = convites; this.carteiras = carteiras; this.membros = membros;
        this.usuarios = usuarios; this.usuarioService = usuarioService; this.events = events;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    private Carteira carteiraDoDono(Long id) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        Carteira carteira = carteiras.buscarComBloqueio(id)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada."));
        if (!carteira.getDono().getId().equals(usuario.getId()))
            throw new AccessDeniedException("Apenas o dono pode gerenciar convites.");
        return carteira;
    }

    @Transactional
    public WalletInvitationResponse convidar(Long carteiraId, WalletMemberRequest request) {
        Carteira carteira = carteiraDoDono(carteiraId);
        TipoPermissao papel = request.getPapel() == null ? TipoPermissao.VISUALIZADOR : request.getPapel();
        if (papel == TipoPermissao.DONO) throw new BusinessException("Convide como EDITOR ou VISUALIZADOR.");
        String email = EmailUtils.normalizar(request.getEmail());
        Usuario destinatario = usuarios.findByEmail(email);
        if (destinatario != null && (destinatario.getId().equals(carteira.getDono().getId())
                || membros.existsByCarteiraAndUsuario(carteira, destinatario)))
            throw new BusinessException("Esta pessoa já é membro da carteira.");
        ConviteCarteira convite = convites.findByCarteiraAndEmail(carteira, email).orElseGet(ConviteCarteira::new);
        LocalDateTime agora = LocalDateTime.now();
        if (convite.getEnviadoEm() != null && convite.getEnviadoEm().isAfter(agora.minusMinutes(1)))
            throw new BusinessException("Aguarde um minuto antes de reenviar o convite.");
        byte[] bytes = new byte[32]; RANDOM.nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);
        convite.setCarteira(carteira); convite.setEmail(email); convite.setPapel(papel);
        convite.setTokenHash(ConfirmacaoCadastroService.hash(token));
        convite.setEnviadoEm(agora); convite.setExpiraEm(agora.plusDays(7));
        convite.setAceitoEm(null); convite.setCancelado(false);
        convites.save(convite);
        events.publishEvent(new ConvitePendente(email, carteira.getNome(), carteira.getDono().getNome(),
                frontendUrl + "/convites/" + token));
        return resposta(convite);
    }

    @Transactional
    public List<WalletInvitationResponse> listar(Long carteiraId) {
        return convites.findByCarteiraOrderByEnviadoEmDesc(carteiraDoDono(carteiraId)).stream()
                .filter(c -> c.getAceitoEm() == null && !c.isCancelado()).map(this::resposta).toList();
    }

    @Transactional
    public void cancelar(Long carteiraId, Long conviteId) {
        Carteira carteira = carteiraDoDono(carteiraId);
        ConviteCarteira convite = convites.findById(conviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Convite não encontrado."));
        if (!convite.getCarteira().getId().equals(carteira.getId()))
            throw new ResourceNotFoundException("Convite não encontrado nesta carteira.");
        convite.setCancelado(true);
        convites.save(convite);
    }

    @Transactional(readOnly = true)
    public WalletInvitationResponse consultar(String token) {
        ConviteCarteira convite = convites.findByTokenHash(hashValido(token))
                .orElseThrow(() -> new ResourceNotFoundException("Convite inválido ou substituído por um novo link."));
        validarPendente(convite);
        return resposta(convite);
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public WalletInvitationResponse aceitar(String token) {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        String hash = hashValido(token);
        // Mantém a mesma ordem de bloqueios usada por reenvio, cancelamento e exclusão.
        Long carteiraId = convites.buscarCarteiraIdPorHash(hash)
                .orElseThrow(() -> new ResourceNotFoundException("Convite inválido."));
        carteiras.buscarComBloqueio(carteiraId)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada."));
        ConviteCarteira convite = convites.buscarComBloqueio(hash)
                .orElseThrow(() -> new ResourceNotFoundException("Convite inválido ou substituído."));
        validarPendente(convite);
        if (!Boolean.TRUE.equals(usuario.getEmailConfirmado()) || !convite.getEmail().equals(EmailUtils.normalizar(usuario.getEmail())))
            throw new AccessDeniedException("Entre com a conta do e-mail convidado e confirme seu cadastro para aceitar.");
        if (!membros.existsByCarteiraAndUsuario(convite.getCarteira(), usuario)) {
            MembroCarteira membro = new MembroCarteira();
            membro.setCarteira(convite.getCarteira()); membro.setUsuario(usuario); membro.setPapel(convite.getPapel());
            membros.save(membro);
        }
        convite.setAceitoEm(LocalDateTime.now()); convites.save(convite);
        return resposta(convite);
    }

    private String hashValido(String token) {
        if (token == null || !token.matches("[a-f0-9]{64}")) throw new IllegalArgumentException("Link de convite inválido.");
        return ConfirmacaoCadastroService.hash(token);
    }
    private void validarPendente(ConviteCarteira c) {
        if (c.isCancelado()) throw new BusinessException("Este convite foi cancelado.");
        if (c.getAceitoEm() != null) throw new BusinessException("Este convite já foi aceito. Acesse suas carteiras.");
        if (!LocalDateTime.now().isBefore(c.getExpiraEm())) throw new BusinessException("Este convite expirou. Peça ao dono um novo convite.");
    }
    private WalletInvitationResponse resposta(ConviteCarteira c) {
        String status = c.isCancelado() ? "CANCELADO" : c.getAceitoEm() != null ? "ACEITO"
                : !LocalDateTime.now().isBefore(c.getExpiraEm()) ? "EXPIRADO" : "PENDENTE";
        return new WalletInvitationResponse(c.getId(), c.getCarteira().getId(), c.getCarteira().getNome(),
                c.getCarteira().getDono().getNome(), c.getEmail(), c.getPapel(), status, c.getExpiraEm());
    }
    public record ConvitePendente(String email, String carteira, String dono, String link) {}
}
