package controle_financeiro.backend.dto;

import controle_financeiro.backend.model.TipoMovimentacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {

    @NotBlank(message = "O nome da categoria é obrigatório")
    @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
    private String name;

    @NotNull(message = "O tipo é obrigatório (RECEITA ou DESPESA)")
    private TipoMovimentacao tipo;

    @Size(max = 7, message = "A cor deve ser um código hex válido (ex: #FF5733)")
    private String cor;

    @Size(max = 50, message = "O nome do ícone deve ter no máximo 50 caracteres")
    private String icone;
}
