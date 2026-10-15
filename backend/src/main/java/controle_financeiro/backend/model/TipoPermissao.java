package controle_financeiro.backend.model;

public enum TipoPermissao {
    DONO,
    EDITOR,
    VISUALIZADOR;

    public static TipoPermissao fromString(String text) {
        if (text == null || text.isBlank()) throw new IllegalArgumentException("Informe DONO, EDITOR ou VISUALIZADOR.");
        String normalizado = text.toUpperCase().trim();
        if ("OWNER".equals(normalizado)) return DONO;
        if ("VIEWER".equals(normalizado)) return VISUALIZADOR;
        try {
            return TipoPermissao.valueOf(normalizado);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Papel inválido. Use DONO, EDITOR ou VISUALIZADOR.");
        }
    }
}
