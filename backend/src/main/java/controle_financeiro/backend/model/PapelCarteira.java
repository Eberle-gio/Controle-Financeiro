package controle_financeiro.backend.model;

public enum PapelCarteira {
    DONO,
    EDITOR,
    VISUALIZADOR;

    public static PapelCarteira fromString(String text) {
        if (text == null || text.isBlank()) {
            return VISUALIZADOR;
        }
        String normalizado = text.toUpperCase().trim();
        if ("OWNER".equals(normalizado)) return DONO;
        if ("VIEWER".equals(normalizado)) return VISUALIZADOR;
        try {
            return PapelCarteira.valueOf(normalizado);
        } catch (IllegalArgumentException e) {
            return VISUALIZADOR;
        }
    }
}
