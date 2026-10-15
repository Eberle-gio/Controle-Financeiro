package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.model.TipoPermissao;
import controle_financeiro.backend.service.CarteiraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wallets")
public class CarteiraController {

    @PutMapping("/default")
    public ResponseEntity<WalletResponse> garantirPadrao() {
        return ResponseEntity.ok(carteiraService.garantirCarteiraPadrao());
    }

    @Autowired
    private CarteiraService carteiraService;

    // GET /api/v1/wallets
    @GetMapping
    public ResponseEntity<List<WalletResponse>> listar() {
        List<WalletResponse> carteiras = carteiraService.listarCarteirasDoUsuario();
        return ResponseEntity.ok(carteiras);
    }

    // POST /api/v1/wallets
    @PostMapping
    public ResponseEntity<WalletResponse> criar(@Valid @RequestBody WalletRequest request) {
        WalletResponse salva = carteiraService.criarCarteira(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    // GET /api/v1/wallets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<WalletResponse> buscarPorId(@PathVariable Long id) {
        WalletResponse carteira = carteiraService.buscarPorId(id);
        return ResponseEntity.ok(carteira);
    }

    // PUT /api/v1/wallets/{id}
    @PutMapping("/{id}")
    public ResponseEntity<WalletResponse> atualizar(@PathVariable Long id,
                                                    @Valid @RequestBody WalletRequest request) {
        WalletResponse atualizada = carteiraService.atualizarCarteira(id, request);
        return ResponseEntity.ok(atualizada);
    }

    // DELETE /api/v1/wallets/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        carteiraService.excluirCarteira(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // ROTAS DE MEMBROS (/api/v1/wallets/{id}/members)
    // ==========================================

    // GET /api/v1/wallets/{id}/members
    @GetMapping("/{id}/members")
    public ResponseEntity<List<WalletMemberResponse>> listarMembros(@PathVariable Long id) {
        List<WalletMemberResponse> membros = carteiraService.listarMembros(id);
        return ResponseEntity.ok(membros);
    }

    // POST /api/v1/wallets/{id}/members
    @PostMapping("/{id}/members")
    public ResponseEntity<WalletMemberResponse> adicionarMembro(@PathVariable Long id,
                                                                @Valid @RequestBody WalletMemberRequest request) {
        WalletMemberResponse membro = carteiraService.adicionarMembro(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(membro);
    }

    // PATCH /api/v1/wallets/{id}/members/{userId}
    @PatchMapping("/{id}/members/{userId}")
    public ResponseEntity<WalletMemberResponse> alterarPapelMembro(@PathVariable Long id,
                                                                    @PathVariable Long userId,
                                                                    @Valid @RequestBody UpdateRoleRequest request) {
        TipoPermissao novoPapel = TipoPermissao.fromString(request.getPapel());
        WalletMemberResponse atualizado = carteiraService.alterarPapelMembro(id, userId, novoPapel);
        return ResponseEntity.ok(atualizado);
    }

    // DELETE /api/v1/wallets/{id}/members/{userId}
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removerMembro(@PathVariable Long id,
                                               @PathVariable Long userId) {
        carteiraService.removerMembro(id, userId);
        return ResponseEntity.noContent().build();
    }
}
