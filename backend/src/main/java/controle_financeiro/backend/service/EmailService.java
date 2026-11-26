package controle_financeiro.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender javaMail;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.from:${spring.mail.username:}}")
    private String remetente;

    @Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

    @Value("${BREVO_SENDER_NAME:NodeBank}")
    private String brevoSenderName;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Async
    public void enviarEmailSimples(String para, String assunto, String mensagem) {
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            enviarViaBrevo(para, assunto, null, mensagem);
            return;
        }

        try {
            if (javaMail == null) {
                log.warn("Nenhum serviço de envio de e-mail configurado (Brevo API ou SMTP).");
                return;
            }
            SimpleMailMessage simpleMail = new SimpleMailMessage();
            if (remetente != null && !remetente.isBlank()) {
                simpleMail.setFrom(remetente);
            }
            simpleMail.setTo(para);
            simpleMail.setSubject(assunto);
            simpleMail.setText(mensagem);
            javaMail.send(simpleMail);
            log.info("E-mail simples enviado com sucesso para {}", para);
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail simples para {}: {}", para, e.getMessage(), e);
        }
    }

    @Async
    public void emailTemplate(String para, String assunto, Context variaveisEmail, String arquivoTemplate) {
        try {
            if ("novoCadastro".equals(arquivoTemplate)) {
                Object link = variaveisEmail.getVariable("confirmUrl");
                if (!(link instanceof String url) || !url.matches("https?://[^\\s]+")) {
                    throw new IllegalArgumentException("E-mail de cadastro sem link de confirmação válido.");
                }
            }
            String process = templateEngine.process(arquivoTemplate, variaveisEmail);

            if (brevoApiKey != null && !brevoApiKey.isBlank()) {
                String logoUrl = frontendUrl.replaceAll("/+$", "") + "/nodebank-favicon.png";
                enviarViaBrevo(para, assunto, process.replace("cid:nodebank-logo", logoUrl), null);
                return;
            }

            if (javaMail == null) {
                log.warn("Nenhum serviço de envio de e-mail configurado (Brevo API ou SMTP).");
                return;
            }

            MimeMessage message = javaMail.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_RELATED, "UTF-8");

            if (remetente != null && !remetente.isBlank()) {
                helper.setFrom(remetente);
            }
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(process, true);
            if ("novoCadastro".equals(arquivoTemplate) || "conviteCarteira".equals(arquivoTemplate)) {
                helper.addInline("nodebank-logo", new ClassPathResource("email/NodeBank.png"), "image/png");
            }

            javaMail.send(message);
            log.info("E-mail template '{}' enviado com sucesso via SMTP para {}", arquivoTemplate, para);
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail template '{}' para {}: {}", arquivoTemplate, para, e.getMessage(), e);
        }
    }

    private void enviarViaBrevo(String para, String assunto, String html, String texto) {
        try {
            if (remetente == null || remetente.isBlank()) {
                log.error("BREVO_API_KEY está configurada, mas SPRING_MAIL_FROM não contém um remetente verificado.");
                return;
            }

            Map<String, Object> payload = html != null
                    ? Map.of(
                            "sender", Map.of("name", brevoSenderName, "email", remetente.trim()),
                            "to", List.of(Map.of("email", para)),
                            "subject", assunto,
                            "htmlContent", html)
                    : Map.of(
                            "sender", Map.of("name", brevoSenderName, "email", remetente.trim()),
                            "to", List.of(Map.of("email", para)),
                            "subject", assunto,
                            "textContent", texto);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", brevoApiKey.trim())
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("E-mail enviado via API do Brevo para {}: {}", para, response.body());
            } else {
                log.error("Brevo recusou o envio para {}. Status: {}, Resposta: {}",
                        para, response.statusCode(), response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Envio via API do Brevo interrompido para {}.", para, e);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail via API do Brevo para {}: {}", para, e.getMessage(), e);
        }
    }

}
