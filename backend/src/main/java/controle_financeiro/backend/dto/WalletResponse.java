package controle_financeiro.backend.dto;

import controle_financeiro.backend.model.TipoPermissao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private Long id;
    private String nome;
    private String descricao;
    private Long donoId;
    private String donoNome;
    private TipoPermissao meuPapel;
    private LocalDateTime criadoEm;
}
