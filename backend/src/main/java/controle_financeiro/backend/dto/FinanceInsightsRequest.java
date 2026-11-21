package controle_financeiro.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record FinanceInsightsRequest(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate) {
}
