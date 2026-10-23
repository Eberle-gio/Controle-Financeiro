package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.WalletInvitationResponse;
import controle_financeiro.backend.service.ConviteCarteiraService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

@RestController
public class ConviteCarteiraController {
    private final ConviteCarteiraService convites;
    public ConviteCarteiraController(ConviteCarteiraService convites) { this.convites = convites; }
    public record AceitarRequest(@NotBlank @Pattern(regexp = "[a-f0-9]{64}") String token) {}
    @GetMapping("/api/invitations/{token}")
    public WalletInvitationResponse consultar(@PathVariable String token) { return convites.consultar(token); }
    @PostMapping("/api/v1/invitations/accept")
    public WalletInvitationResponse aceitar(@Valid @RequestBody AceitarRequest request) { return convites.aceitar(request.token()); }
}
