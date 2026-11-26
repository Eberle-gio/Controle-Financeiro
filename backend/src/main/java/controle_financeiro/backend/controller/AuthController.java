package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.service.UsuarioService;
import controle_financeiro.backend.service.ConfirmacaoCadastroService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ConfirmacaoCadastroService confirmacaoCadastroService;

    public record ConfirmarCadastroRequest(@NotBlank @Size(max = 64) String token) {}
    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record LogoutRequest(String refreshToken) {}

    @PostMapping("/confirm-email")
    public ResponseEntity<Map<String, String>> confirmarCadastro(@Valid @RequestBody ConfirmarCadastroRequest request) {
        confirmacaoCadastroService.confirmar(request.token());
        return ResponseEntity.ok(Map.of("message", "E-mail confirmado! Você já pode entrar no NodeBank."));
    }

    @PostMapping("/resend-confirmation")
    public ResponseEntity<Map<String, String>> reenviarConfirmacao(@Valid @RequestBody ForgotPasswordRequest request) {
        confirmacaoCadastroService.reenviar(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Se houver um cadastro pendente, você receberá um novo link. Aguarde pelo menos um minuto entre solicitações."));
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> registrar(@Valid @RequestBody RegisterRequest request) {
        UserResponseDTO usuarioSalvo = usuarioService.cadastrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioSalvo);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = usuarioService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(HttpServletRequest request) {
        String token = (String) request.getAttribute(
                controle_financeiro.backend.security.SpaCsrfTokenRequestHandler.RAW_TOKEN_ATTRIBUTE);
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("Token CSRF não foi gerado para a requisição.");
        }
        return Map.of("token", token);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(usuarioService.renovarSessao(request.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) LogoutRequest request) {
        String refreshToken = request == null ? null : request.refreshToken();
        usuarioService.encerrarSessao(extrairBearer(authorization), refreshToken);
        return ResponseEntity.noContent().build();
    }

    private String extrairBearer(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        return authorization.substring(7).trim();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        usuarioService.solicitarRecuperacaoSenha(request.getEmail());
        
        Map<String, String> resposta = Map.of(
            "message", "Se este e-mail estiver cadastrado, você receberá as instruções em breve."
        );
        return ResponseEntity.ok(resposta);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        usuarioService.redefinirSenha(request);
        return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso."));
    }
}
