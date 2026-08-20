package controle_financeiro.backend.util;

public class EmailUtils {

    private EmailUtils() {

    }

    public static String normalizar(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
