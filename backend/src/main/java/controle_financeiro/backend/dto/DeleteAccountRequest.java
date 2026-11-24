package controle_financeiro.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank(message = "Confirme sua senha atual") String currentPassword,
        @NotBlank(message = "Digite EXCLUIR para confirmar") String confirmation
) {}
