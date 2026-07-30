package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.LoginRequest;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@Valid @RequestBody Usuario usuario) {
        try {
            Usuario usuarioSalvo = usuarioService.cadastrar(usuario);
            // Oculta o hash da senha por motivos de segurança antes de retornar os dados
            usuarioSalvo.setPassword(null);
            return ResponseEntity.status(HttpStatus.CREATED).body(usuarioSalvo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Usuario usuario = usuarioService.login(loginRequest.getEmail(), loginRequest.getPassword());

            // Retorna os dados do usuário no formato esperado pelo frontend (token + user)
            // Token temporário (sem JWT) apenas para manter a sessão no localStorage
            String tokenTemp = "session_" + usuario.getId() + "_" + System.currentTimeMillis();

            Map<String, Object> resposta = Map.of(
                "token", tokenTemp,
                "user", Map.of(
                    "id", usuario.getId(),
                    "name", usuario.getName(),
                    "email", usuario.getEmail()
                )
            );

            return ResponseEntity.ok(resposta);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }
}
