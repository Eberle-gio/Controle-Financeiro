package controle_financeiro.backend.controller;

import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Permite a comunicação direta com o frontend React rodando em outra porta
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
}
