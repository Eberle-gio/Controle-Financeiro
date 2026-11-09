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
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender javaMail;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username:}")
    private String remetente;

    @Value("${resend.api.key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${resend.from:NodeBank <onboarding@resend.dev>}")
    private String resendFrom;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Async
    public void enviarEmailSimples(String para, String assunto, String mensagem) {
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            enviarViaResend(para, assunto, null, mensagem);
            return;
        }

        try {
            if (javaMail == null) {
                log.warn("Nenhum serviço de envio de e-mail configurado (nem Resend nem SMTP).");
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

            if (resendApiKey != null && !resendApiKey.isBlank()) {
                enviarViaResend(para, assunto, process, null);
                return;
            }

            if (javaMail == null) {
                log.warn("Nenhum serviço de envio de e-mail configurado (nem Resend nem SMTP).");
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
            if ("novoCadastro".equals(arquivoTemplate)) {
                helper.addInline("nodebank-logo", new ClassPathResource("email/NodeBank.png"), "image/png");
            }

            javaMail.send(message);
            log.info("E-mail template '{}' enviado com sucesso via SMTP para {}", arquivoTemplate, para);
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail template '{}' para {}: {}", arquivoTemplate, para, e.getMessage(), e);
        }
    }

    private void enviarViaResend(String para, String assunto, String html, String text) {
        try {
            Map<String, Object> payload = html != null 
                    ? Map.of("from", resendFrom, "to", List.of(para), "subject", assunto, "html", html)
                    : Map.of("from", resendFrom, "to", List.of(para), "subject", assunto, "text", text);

            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("E-mail enviado com sucesso via Resend HTTP para {}: {}", para, response.body());
            } else {
                log.error("Erro na resposta do Resend HTTP para {}. Status: {}, Resposta: {}", para, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Falha ao comunicar com a API do Resend para {}: {}", para, e.getMessage(), e);
        }
    }
}
