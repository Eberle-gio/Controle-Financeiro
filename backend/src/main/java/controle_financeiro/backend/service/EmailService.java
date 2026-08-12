package controle_financeiro.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender javaMail;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username:}")
    private String remetente;

    @Async
    public void enviarEmailSimples(String para, String assunto, String mensagem) {
        try {
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
            String process = templateEngine.process(arquivoTemplate, variaveisEmail);
            MimeMessage message = javaMail.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            if (remetente != null && !remetente.isBlank()) {
                helper.setFrom(remetente);
            }
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(process, true);

            javaMail.send(message);
            log.info("E-mail template '{}' enviado com sucesso para {}", arquivoTemplate, para);
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail template '{}' para {}: {}", arquivoTemplate, para, e.getMessage(), e);
        }
    }
}
