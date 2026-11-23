package controle_financeiro.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    @JsonIgnore
    private String accessToken;
    @JsonIgnore
    private String refreshToken;
    private UserResponseDTO user;
    @Builder.Default
    private String tokenType = "Cookie";
    @Builder.Default
    private long expiresIn = 86400; // 24 horas em segundos
}
