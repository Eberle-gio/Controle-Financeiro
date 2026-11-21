package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.FinanceInsightsRequest;
import controle_financeiro.backend.dto.FinanceInsightsResponse;
import controle_financeiro.backend.service.FinanceInsightsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallets/{walletId}/insights")
public class FinanceInsightsController {
    private final FinanceInsightsService financeInsightsService;

    public FinanceInsightsController(FinanceInsightsService financeInsightsService) {
        this.financeInsightsService = financeInsightsService;
    }

    @PostMapping
    public ResponseEntity<FinanceInsightsResponse> gerar(
            @PathVariable Long walletId,
            @Valid @RequestBody FinanceInsightsRequest request) {
        return ResponseEntity.ok(financeInsightsService.gerar(
                walletId, request.startDate(), request.endDate()));
    }
}
