package controle_financeiro.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumoCarteiraDTO {

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private int transactionCount;

    // Totais agrupados por categoria: [{categoryId, categoryName, total}]
    private List<Map<String, Object>> byCategory;

    // Totais agrupados por data para o gráfico: [{date, receitas, despesas}]
    private List<Map<String, Object>> byDate;

    // Últimas 10 transações com dados da categoria enriquecidos
    private List<Map<String, Object>> recentTransactions;
}
