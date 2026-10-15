package controle_financeiro.backend.service;

import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.UsuarioRepository;
import controle_financeiro.backend.util.EmailUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class ConfirmacaoCadastroService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UsuarioRepository usuarios;
    private final ApplicationEventPublisher events;
    private final String frontendUrl;

    public ConfirmacaoCadastroService(UsuarioRepository usuarios, ApplicationEventPublisher events,
                                     @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.usuarios = usuarios;
        this.events = events;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    // Chamado na mesma transacao do cadastro ou reenvio.
    public void prepararEnvio(Usuario usuario) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);
        usuario.setEmailConfirmado(false);
        usuario.setConfirmacaoTokenHash(hash(token));
        usuario.setConfirmacaoEnviadaEm(LocalDateTime.now());
        usuario.setConfirmacaoExpiraEm(LocalDateTime.now().plusHours(24));
        usuarios.save(usuario);
        events.publishEvent(new CadastroPendente(usuario.getEmail(), usuario.getNome(),
                frontendUrl + "/confirmar-cadastro/" + token));
    }

    @Transactional
    public void confirmar(String token) {
        if (token == null || !token.matches("[a-f0-9]{64}")) {
            throw new IllegalArgumentException("Link de confirmação inválido.");
        }
        Usuario usuario = usuarios.buscarPorConfirmacaoToken(hash(token))
                .orElseThrow(() -> new IllegalArgumentException("Link inválido ou já utilizado. Solicite um novo e-mail de confirmação."));
        if (!Boolean.FALSE.equals(usuario.getEmailConfirmado()) || usuario.getConfirmacaoExpiraEm() == null
                || !LocalDateTime.now().isBefore(usuario.getConfirmacaoExpiraEm())) {
            throw new IllegalArgumentException("Link de confirmação expirado. Solicite um novo e-mail.");
        }
        usuario.setEmailConfirmado(true);
        usuario.setConfirmacaoTokenHash(null);
        usuario.setConfirmacaoExpiraEm(null);
        usuarios.save(usuario);
    }

    @Transactional
    public void reenviar(String email) {
        usuarios.buscarParaConfirmacaoPorEmail(EmailUtils.normalizar(email)).ifPresent(usuario -> {
            if (!Boolean.TRUE.equals(usuario.getEmailConfirmado())
                    && (usuario.getConfirmacaoEnviadaEm() == null
                    || usuario.getConfirmacaoEnviadaEm().isBefore(LocalDateTime.now().minusMinutes(1)))) {
                prepararEnvio(usuario);
            }
        });
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public record CadastroPendente(String email, String nome, String confirmUrl) {}
}
