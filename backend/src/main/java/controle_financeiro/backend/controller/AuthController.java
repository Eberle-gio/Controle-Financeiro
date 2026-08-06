package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

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

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String debugToken = usuarioService.solicitarRecuperacaoSenha(request.getEmail());
        
        Map<String, String> resposta = Map.of(
            "message", "Se este e-mail estiver cadastrado, você receberá as instruções em breve.",
            "debugToken", debugToken
        );
        return ResponseEntity.ok(resposta);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        usuarioService.redefinirSenha(request);
        return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso."));
    }
}
