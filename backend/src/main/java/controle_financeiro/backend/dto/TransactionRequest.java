package controle_financeiro.backend.dto;

import controle_financeiro.backend.model.TipoMovimentacao;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequest {

    @NotBlank(message = "A descrição é obrigatória")
    @Size(max = 255, message = "A descrição deve ter no máximo 255 caracteres")
    private String descricao;

    @NotNull(message = "O valor é obrigatório")
    @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
    @Digits(integer = 13, fraction = 2, message = "O valor deve ter no máximo 13 dígitos inteiros e 2 casas decimais")
    private BigDecimal valor;

    @NotNull(message = "O tipo é obrigatório (RECEITA ou DESPESA)")
    private TipoMovimentacao tipo;

    private Long categoryId;

    @NotNull(message = "A data é obrigatória")
    private LocalDate data;
}
