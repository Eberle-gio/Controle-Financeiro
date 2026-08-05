package controle_financeiro.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EnvioEmailSender {

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private TemplateEngine templeteEngine;

    public void enviarEmail(String destinatario, String assunto, String texto){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(destinatario);
        message.setSubject(assunto);
        message.setText(texto);
        javaMailSender.send(message);
    }

    @Async
    public void enviarEmailtemplate(String destinatario, String assunto, String template, Context contexto){
        String templateString = templeteEngine.process(template, contexto);
        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper;

        try {
            helper = new MimeMessageHelper(message, true);
            helper.setTo(destinatario);
            helper.setSubject(assunto);
            helper.setText(templateString, true);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
        javaMailSender.send(message);
       
    }
}

