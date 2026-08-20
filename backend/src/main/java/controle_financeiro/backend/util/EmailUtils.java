package controle_financeiro.backend.util;

public class EmailUtils {

    private EmailUtils() {
        // Construtor privado para evitar instanciação de classe utilitária estática
    }

    /**
     * Normaliza um e-mail removendo espaços nas extremidades e convertendo para minúsculas.
     * Retorna string vazia ("") caso o valor recebido seja nulo.
     *
     * @param email E-mail a ser normalizado
     * @return E-mail formatado em minúsculas e sem espaços extras
     */
    public static String normalizar(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
