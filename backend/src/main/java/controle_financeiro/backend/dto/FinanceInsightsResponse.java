package controle_financeiro.backend.dto;

import java.util.List;

public record FinanceInsightsResponse(List<InsightItem> insights) {
    public record InsightItem(String title, String observation, String nextStep) {}
}
