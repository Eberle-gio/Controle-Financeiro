package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.ChangePasswordRequest;
import controle_financeiro.backend.dto.UpdateProfileRequest;
import controle_financeiro.backend.dto.UserResponseDTO;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getPerfil() {
        Usuario usuario = usuarioService.getUsuarioAutenticado();
        return ResponseEntity.ok(UserResponseDTO.fromEntity(usuario));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponseDTO> atualizarPerfil(@Valid @RequestBody UpdateProfileRequest request) {
        UserResponseDTO dto = usuarioService.atualizarPerfil(request.getName());
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Map<String, String>> alterarSenha(@Valid @RequestBody ChangePasswordRequest request) {
        usuarioService.alterarSenha(request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso."));
    }
}
