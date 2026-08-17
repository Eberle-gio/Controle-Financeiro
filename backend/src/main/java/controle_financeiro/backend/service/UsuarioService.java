package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.exception.*;
import controle_financeiro.backend.exception.ResourceNotFoundException;
import controle_financeiro.backend.model.PasswordResetToken;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.PasswordResetTokenRepository;
import controle_financeiro.backend.repository.UsuarioRepository;
import controle_financeiro.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired(required = false)
    private EmailService emailService;

    @Lazy
    @Autowired
    private CategoriaService categoriaService;

    @Transactional
    public UserResponseDTO cadastrar(RegisterRequest request) {
        String emailNormalizado = normalizarEmail(request.getEmail());

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

        // Envia e-mail de boas-vindas assíncrono
        if (emailService != null) {
            try {
                Context context = new Context();
                context.setVariable("name", usuarioSalvo.getNome());
                emailService.emailTemplate(usuarioSalvo.getEmail(), "Bem-vindo ao Controle Financeiro", context, "novoCadastro");
            } catch (Exception ignored) {
            }
        }

        return UserResponseDTO.fromEntity(usuarioSalvo);
    }

    public LoginResponse login(LoginRequest request) {
        String emailNormalizado = normalizarEmail(request.getEmail());
        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado);

        if (usuario == null || !passwordEncoder.matches(request.getPassword(), usuario.getSenha())) {
            throw new BusinessException("Credenciais inválidas.");
        }

        String token = jwtUtils.gerarToken(usuario.getId(), usuario.getEmail(), usuario.getNome());

        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(86400)
                .build();
    }

    @Transactional
    public String solicitarRecuperacaoSenha(String email) {
        String emailNormalizado = normalizarEmail(email);
        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado);
        
        // Retorna um token simulado sem salvar caso o e-mail não exista para não expor e-mails cadastrados
        if (usuario == null) {
            return UUID.randomUUID().toString();
        }

        String tokenUUID = UUID.randomUUID().toString();
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
                context.setVariable("resetUrl", "http://localhost:5173/redefinir-senha/" + tokenUUID);
                emailService.emailTemplate(usuario.getEmail(), "Recuperação de Senha - Controle Financeiro", context, "recuperacaoSenha");
            } catch (Exception ignored) {
            }
        }

        return tokenUUID;
    }

    @Transactional
    public void redefinirSenha(ResetPasswordRequest request) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Token de redefinição inválido ou não encontrado."));

        if (resetToken.isUtilizado()) {
            throw new IllegalArgumentException("Token de redefinição já utilizado.");
        }

        if (resetToken.estaExpirado()) {
            throw new IllegalArgumentException("Token de redefinição expirado.");
        }

        Usuario usuario = resetToken.getUsuario();
        usuario.setSenha(passwordEncoder.encode(request.getNewPassword()));
        usuarioRepository.save(usuario);

        resetToken.setUtilizado(true);
        resetTokenRepository.save(resetToken);
    }

    @Transactional
    public void alterarSenha(String senhaAtual, String novaSenha) {
        Usuario usuario = getUsuarioAutenticado();
        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new BusinessException("Senha atual incorreta.");
        }

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
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
        String emailNormalizado = normalizarEmail(email);
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

    private String normalizarEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
