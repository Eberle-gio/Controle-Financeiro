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
public class WalletMemberResponse {
    private Long id;
    private Long usuarioId;
    private String usuarioNome;
    private String usuarioEmail;
    private TipoPermissao papel;
    private LocalDateTime entradoEm;
}
