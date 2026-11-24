package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.ChangePasswordRequest;
import controle_financeiro.backend.dto.DeleteAccountRequest;
import controle_financeiro.backend.dto.UpdateProfileRequest;
import controle_financeiro.backend.dto.UserResponseDTO;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UsuarioService usuarioService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

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

    @GetMapping("/me/account-deletion-summary")
    public ResponseEntity<controle_financeiro.backend.dto.AccountDeletionSummaryResponse> resumoExclusaoConta() {
        return ResponseEntity.ok(usuarioService.resumoExclusaoConta());
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> excluirConta(@Valid @RequestBody DeleteAccountRequest request) {
        usuarioService.excluirConta(request.currentPassword(), request.confirmation());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, limparCookie("access_token", "/"))
                .header(HttpHeaders.SET_COOKIE, limparCookie("refresh_token", "/api/auth"))
                .header(HttpHeaders.SET_COOKIE, limparCookie("XSRF-TOKEN", "/"))
                .build();
    }

    private String limparCookie(String nome, String caminho) {
        return ResponseCookie.from(nome, "")
                .httpOnly(!"XSRF-TOKEN".equals(nome))
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(caminho)
                .maxAge(Duration.ZERO)
                .build()
                .toString();
    }
}
