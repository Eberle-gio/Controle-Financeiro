package controle_financeiro.backend.dto;

import controle_financeiro.backend.model.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private LocalDateTime createdAt;

    public static UserResponseDTO fromEntity(Usuario usuario) {
        if (usuario == null) return null;
        return UserResponseDTO.builder()
                .id(usuario.getId())
                .name(usuario.getName())
                .email(usuario.getEmail())
                .createdAt(usuario.getCreatedAt())
                .build();
    }
}
