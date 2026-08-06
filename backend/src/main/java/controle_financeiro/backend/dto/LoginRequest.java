package controle_financeiro.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "E-mail em formato inválido")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    private String password;
}
