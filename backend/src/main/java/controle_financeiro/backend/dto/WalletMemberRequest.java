package controle_financeiro.backend.dto;

import controle_financeiro.backend.model.TipoPermissao;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WalletMemberRequest {

    @NotBlank(message = "O e-mail do membro é obrigatório")
    @Email(message = "E-mail em formato inválido")
    private String email;

    private TipoPermissao papel;
}
