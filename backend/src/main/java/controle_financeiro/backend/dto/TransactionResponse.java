package controle_financeiro.backend.dto;

import controle_financeiro.backend.model.TipoMovimentacao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private Long walletId;
    private String descricao;
    private BigDecimal valor;
    private TipoMovimentacao tipo;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
    private String categoryIcon;
    private Long criadoPorId;
    private String criadoPorNome;
    private LocalDate data;
    private LocalDateTime criadoEm;
}
