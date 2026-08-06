package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.model.PapelCarteira;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.service.CarteiraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/wallets", "/api/carteiras"})
public class CarteiraController {

    @Autowired
    private CarteiraService carteiraService;

    // GET /api/v1/wallets
    @GetMapping
    public ResponseEntity<List<WalletResponse>> listar(@AuthenticationPrincipal Usuario usuario) {
        List<WalletResponse> carteiras = carteiraService.listarCarteirasDoUsuario(usuario);
        return ResponseEntity.ok(carteiras);
    }

    // POST /api/v1/wallets
    @PostMapping
    public ResponseEntity<WalletResponse> criar(@AuthenticationPrincipal Usuario usuario,
                                                @Valid @RequestBody WalletRequest request) {
        WalletResponse salva = carteiraService.criarCarteira(request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    // GET /api/v1/wallets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<WalletResponse> buscarPorId(@AuthenticationPrincipal Usuario usuario,
                                                      @PathVariable Long id) {
        WalletResponse carteira = carteiraService.buscarPorId(id, usuario);
        return ResponseEntity.ok(carteira);
    }

    // PUT /api/v1/wallets/{id}
    @PutMapping("/{id}")
    public ResponseEntity<WalletResponse> atualizar(@AuthenticationPrincipal Usuario usuario,
                                                    @PathVariable Long id,
                                                    @Valid @RequestBody WalletRequest request) {
        WalletResponse atualizada = carteiraService.atualizarCarteira(id, request, usuario);
        return ResponseEntity.ok(atualizada);
    }

    // DELETE /api/v1/wallets/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@AuthenticationPrincipal Usuario usuario,
                                         @PathVariable Long id) {
        carteiraService.excluirCarteira(id, usuario);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // ROTAS DE MEMBROS (/api/v1/wallets/{id}/members)
    // ==========================================

    // GET /api/v1/wallets/{id}/members
    @GetMapping("/{id}/members")
    public ResponseEntity<List<WalletMemberResponse>> listarMembros(@AuthenticationPrincipal Usuario usuario,
                                                                    @PathVariable Long id) {
        List<WalletMemberResponse> membros = carteiraService.listarMembros(id, usuario);
        return ResponseEntity.ok(membros);
    }

    // POST /api/v1/wallets/{id}/members
    @PostMapping("/{id}/members")
    public ResponseEntity<WalletMemberResponse> adicionarMembro(@AuthenticationPrincipal Usuario usuario,
                                                                @PathVariable Long id,
                                                                @Valid @RequestBody WalletMemberRequest request) {
        WalletMemberResponse membro = carteiraService.adicionarMembro(id, request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(membro);
    }

    // PATCH /api/v1/wallets/{id}/members/{userId}
    @PatchMapping("/{id}/members/{userId}")
    public ResponseEntity<WalletMemberResponse> alterarPapelMembro(@AuthenticationPrincipal Usuario usuario,
                                                                    @PathVariable Long id,
                                                                    @PathVariable Long userId,
                                                                    @RequestBody Map<String, String> body) {
        String papelStr = body.get("papel");
        PapelCarteira novoPapel = PapelCarteira.fromString(papelStr);
        WalletMemberResponse atualizado = carteiraService.alterarPapelMembro(id, userId, novoPapel, usuario);
        return ResponseEntity.ok(atualizado);
    }

    // DELETE /api/v1/wallets/{id}/members/{userId}
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removerMembro(@AuthenticationPrincipal Usuario usuario,
                                               @PathVariable Long id,
                                               @PathVariable Long userId) {
        carteiraService.removerMembro(id, userId, usuario);
        return ResponseEntity.noContent().build();
    }
}
