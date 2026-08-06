package controle_financeiro.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private long transactionCount;
    private List<CategorySummaryDTO> byCategory;
    private List<DateSummaryDTO> byDate;
    private List<TransactionResponse> recentTransactions;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategorySummaryDTO {
        private Long categoryId;
        private String categoryName;
        private String categoryColor;
        private String categoryIcon;
        private BigDecimal total;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DateSummaryDTO {
        private String date;
        private BigDecimal receitas;
        private BigDecimal despesas;
    }
}
