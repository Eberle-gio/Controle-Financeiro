package controle_financeiro.backend.dto;

import controle_financeiro.backend.model.TipoPermissao;
import java.time.LocalDateTime;

public record WalletInvitationResponse(Long id, Long walletId, String walletName, String ownerName,
                                      String email, TipoPermissao papel, String status, LocalDateTime expiresAt) {}
