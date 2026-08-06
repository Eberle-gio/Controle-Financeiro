package controle_financeiro.backend.model;

import controle_financeiro.backend.exception.BusinessException;

public enum TipoMovimentacao {
    RECEITA,
    DESPESA;

    public static TipoMovimentacao fromString(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String norm = text.toUpperCase().trim();
        if ("INCOME".equals(norm)) return RECEITA;
        if ("EXPENSE".equals(norm)) return DESPESA;
        try {
            return TipoMovimentacao.valueOf(norm);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Tipo inválido. Use INCOME, EXPENSE, RECEITA ou DESPESA.");
        }
    }
}
