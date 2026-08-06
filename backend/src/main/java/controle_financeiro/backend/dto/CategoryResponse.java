package controle_financeiro.backend.dto;

import controle_financeiro.backend.model.TipoMovimentacao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private TipoMovimentacao tipo;
    private String cor;
    private String icone;
}
