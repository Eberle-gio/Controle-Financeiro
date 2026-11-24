package controle_financeiro.backend.dto;

import java.util.List;

public record AccountDeletionSummaryResponse(int activeWalletCount, List<String> activeWalletNames) {}
