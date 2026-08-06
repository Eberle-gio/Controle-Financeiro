package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.service.TransacaoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping({"/api/v1/wallets/{walletId}", "/api/carteiras/{walletId}"})
public class TransacaoController {

    @Autowired
    private TransacaoService transacaoService;

    // GET /api/v1/wallets/{walletId}/transactions (Paginado)
    @GetMapping("/transactions")
    public ResponseEntity<PageResponse<TransactionResponse>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long walletId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date,desc") String sort,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String type
    ) {
        PageResponse<TransactionResponse> resultado = transacaoService.listarPaginado(
                walletId, page, size, sort, startDate, endDate, categoryId, type, usuario
        );
        return ResponseEntity.ok(resultado);
    }

    // POST /api/v1/wallets/{walletId}/transactions
    @PostMapping("/transactions")
    public ResponseEntity<TransactionResponse> criar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long walletId,
            @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse salva = transacaoService.criar(walletId, request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    // GET /api/v1/wallets/{walletId}/transactions/{id}
    @GetMapping("/transactions/{id}")
    public ResponseEntity<TransactionResponse> buscarPorId(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long walletId,
            @PathVariable Long id
    ) {
        TransactionResponse transacao = transacaoService.buscarPorId(walletId, id, usuario);
        return ResponseEntity.ok(transacao);
    }

    // PUT /api/v1/wallets/{walletId}/transactions/{id}
    @PutMapping("/transactions/{id}")
    public ResponseEntity<TransactionResponse> atualizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long walletId,
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse atualizada = transacaoService.atualizar(walletId, id, request, usuario);
        return ResponseEntity.ok(atualizada);
    }

    // DELETE /api/v1/wallets/{walletId}/transactions/{id}
    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> excluir(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long walletId,
            @PathVariable Long id
    ) {
        transacaoService.excluir(walletId, id, usuario);
        return ResponseEntity.noContent().build();
    }

    // GET /api/v1/wallets/{walletId}/summary
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> obterResumo(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long walletId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        DashboardSummaryResponse resumo = transacaoService.obterResumoDashboard(walletId, startDate, endDate, usuario);
        return ResponseEntity.ok(resumo);
    }
}
