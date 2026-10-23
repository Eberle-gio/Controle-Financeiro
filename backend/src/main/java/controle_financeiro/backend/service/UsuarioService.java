package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.exception.*;
import controle_financeiro.backend.exception.ResourceNotFoundException;
import controle_financeiro.backend.model.PasswordResetToken;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.PasswordResetTokenRepository;
import controle_financeiro.backend.repository.UsuarioRepository;
import controle_financeiro.backend.security.JwtUtils;
import controle_financeiro.backend.util.EmailUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UsuarioService {
    private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private Usuario bloquearUsuario(Long id) {
        Usuario usuario = usuarioRepository.buscarPorIdComBloqueio(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        // A autenticação ou o token podem já ter carregado uma versão antiga na sessão JPA.
        entityManager.refresh(usuario);
        return usuario;
    }

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ConfirmacaoCadastroService confirmacaoCadastroService;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Autowired(required = false)
    private EmailService emailService;

    @Lazy
    @Autowired
    private CategoriaService categoriaService;

    @Transactional
    public UserResponseDTO cadastrar(RegisterRequest request) {
        String emailNormalizado = EmailUtils.normalizar(request.getEmail());

        if (usuarioRepository.findByEmail(emailNormalizado) != null) {
            throw new DataIntegrityViolationException("E-mail já cadastrado no sistema.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.getName());
        usuario.setEmail(emailNormalizado);
        usuario.setSenha(passwordEncoder.encode(request.getPassword()));

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        // Pré-popula as categorias padrão para o novo usuário dentro da mesma transação
        if (categoriaService != null) {
            categoriaService.criarCategoriasPadrao(usuarioSalvo);
        }

        confirmacaoCadastroService.prepararEnvio(usuarioSalvo);

        return UserResponseDTO.fromEntity(usuarioSalvo);
    }

    public LoginResponse login(LoginRequest request) {
        String emailNormalizado = EmailUtils.normalizar(request.getEmail());
        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado);

        if (usuario == null || !passwordEncoder.matches(request.getPassword(), usuario.getSenha())) {
            throw new BusinessException("Credenciais inválidas.");
        }

        if (!Boolean.TRUE.equals(usuario.getEmailConfirmado())) {
            throw new BusinessException("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada ou solicite um novo link.");
        }

        String token = jwtUtils.gerarToken(usuario.getId(), usuario.getEmail(), usuario.getNome(), usuario.getVersaoSessao());

        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getExpirationSeconds())
                .build();
    }

    @Transactional
    public String solicitarRecuperacaoSenha(String email) {
        String emailNormalizado = EmailUtils.normalizar(email);
        Usuario usuario = usuarioRepository.buscarParaConfirmacaoPorEmail(emailNormalizado).orElse(null);
        
        // Retorna um token simulado sem salvar caso o e-mail não exista para não expor e-mails cadastrados
        if (usuario == null) {
            return UUID.randomUUID().toString();
        }

        String tokenUUID = UUID.randomUUID().toString();
        resetTokenRepository.invalidarTodos(usuario);
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUsuario(usuario);
        resetToken.setToken(tokenUUID);
        resetToken.setExpiraEm(LocalDateTime.now().plusHours(1));
        resetToken.setUtilizado(false);

        resetTokenRepository.save(resetToken);

        // Envia o e-mail de recuperação de senha com o link contendo o token
        if (emailService != null) {
            try {
                Context context = new Context();
                context.setVariable("name", usuario.getNome());
                context.setVariable("token", tokenUUID);
                context.setVariable("resetUrl", frontendUrl.replaceAll("/+$", "") + "/redefinir-senha/" + tokenUUID);
                emailService.emailTemplate(usuario.getEmail(), "Recuperação de Senha - Controle Financeiro", context, "recuperacaoSenha");
            } catch (Exception e) {
                log.error("Falha ao solicitar envio de recuperação de senha para o usuário {}", usuario.getId(), e);
            }
        }

        return tokenUUID;
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public void redefinirSenha(ResetPasswordRequest request) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Token de redefinição inválido ou não encontrado."));

        Usuario usuario = bloquearUsuario(resetToken.getUsuario().getId());
        // Releitura após o bloqueio do usuário evita reutilização simultânea do mesmo link.
        if (resetToken.isUtilizado() || resetTokenRepository.existsByTokenAndUtilizadoTrue(request.getToken())) {
            throw new IllegalArgumentException("Token de redefinição já utilizado.");
        }

        if (resetToken.estaExpirado()) {
            throw new IllegalArgumentException("Token de redefinição expirado.");
        }

        usuario.setSenha(passwordEncoder.encode(request.getNewPassword()));
        usuario.setVersaoSessao((usuario.getVersaoSessao() == null ? 0L : usuario.getVersaoSessao()) + 1);
        usuarioRepository.save(usuario);

        resetTokenRepository.invalidarTodos(usuario);
    }

    @Transactional
    public void alterarSenha(String senhaAtual, String novaSenha) {
        Usuario usuario = bloquearUsuario(getUsuarioAutenticado().getId());
        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new BusinessException("Senha atual incorreta.");
        }

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuario.setVersaoSessao((usuario.getVersaoSessao() == null ? 0L : usuario.getVersaoSessao()) + 1);
        usuarioRepository.save(usuario);
        resetTokenRepository.invalidarTodos(usuario);
    }

    @Transactional
    public UserResponseDTO atualizarPerfil(String novoNome) {
        Usuario usuario = getUsuarioAutenticado();
        if (novoNome != null && !novoNome.isBlank()) {
            usuario.setNome(novoNome);
        }
        Usuario salvo = usuarioRepository.save(usuario);

        return UserResponseDTO.fromEntity(salvo);
    }

    public Usuario buscarPorEmail(String email) {
        String emailNormalizado = EmailUtils.normalizar(email);
        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuário não encontrado.");
        }
        return usuario;
    }

    public Usuario getUsuarioAutenticado() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null || !autenticacao.isAuthenticated() || "anonymousUser".equals(autenticacao.getPrincipal())) {
            throw new AccessDeniedException("Usuário não autenticado.");
        }
        String email = autenticacao.getName();
        Usuario usuario = usuarioRepository.findByEmail(email);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuário autenticado não encontrado.");
        }
        return usuario;
    }
}
