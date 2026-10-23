package controle_financeiro.backend.service;

import jakarta.mail.Session;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
import org.springframework.core.io.ClassPathResource;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmailCadastroTest {
    @Test
    void conviteEnviaEmailComLinkSemPrecisarDeContaEComNomesEscapados() throws Exception {
        var resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/"); resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML"); resolver.setCharacterEncoding("UTF-8");
        var engine = new SpringTemplateEngine(); engine.setTemplateResolver(resolver);
        var sender = mock(JavaMailSender.class);
        var message = new MimeMessage(Session.getInstance(new Properties()));
        when(sender.createMimeMessage()).thenReturn(message);
        var emailService = new EmailService();
        ReflectionTestUtils.setField(emailService, "javaMail", sender);
        ReflectionTestUtils.setField(emailService, "templateEngine", engine);
        ReflectionTestUtils.setField(emailService, "remetente", "nodebank@example.com");
        var listener = new ConviteEmailListener(emailService);
        String link = "https://nodebank.example/convites/" + "a".repeat(64);
        listener.enviar(new ConviteCarteiraService.ConvitePendente("sem-cadastro@example.com", "<script>carteira</script>", "<b>Dono</b>", link));
        verify(sender).send(message);
        assertEquals("sem-cadastro@example.com", message.getAllRecipients()[0].toString());
        message.saveChanges();
        String html = (String) encontrarParte(message, "text/html").getContent();
        assertTrue(html.contains("href=\"" + link + "\""));
        assertFalse(html.contains("<script>")); assertFalse(html.contains("<b>Dono</b>"));
        assertTrue(html.contains("7 dias"));
    }

    @Test
    void enviaTemplateComLinkEscapadoELogoInline() throws Exception {
        var resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
        var engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        var context = new Context();
        context.setVariable("name", "<script>alert(1)</script>");
        context.setVariable("confirmUrl", "https://nodebank.example/confirmar-cadastro/abc");
        String html = engine.process("novoCadastro", context);
        assertFalse(html.contains("<script>"));
        assertTrue(html.contains("https://nodebank.example/confirmar-cadastro/abc"));
        assertTrue(html.contains("href=\"https://nodebank.example/confirmar-cadastro/abc\""));
        assertFalse(html.contains("th:href"));
        assertFalse(html.contains("24 horas"));

        var sender = mock(JavaMailSender.class);
        var message = new MimeMessage(Session.getInstance(new Properties()));
        when(sender.createMimeMessage()).thenReturn(message);
        var service = new EmailService();
        ReflectionTestUtils.setField(service, "javaMail", sender);
        ReflectionTestUtils.setField(service, "templateEngine", engine);
        ReflectionTestUtils.setField(service, "remetente", "nodebank@example.com");
        service.emailTemplate("cliente@example.com", "Confirme seu cadastro no NodeBank", context, "novoCadastro");
        verify(sender).send(message);
        var output = new ByteArrayOutputStream();
        message.writeTo(output);
        String mime = output.toString(StandardCharsets.UTF_8);
        assertTrue(mime.contains("Content-ID: <nodebank-logo>"));
        assertTrue(mime.contains("Content-Type: image/png"));
        Part logo = encontrarParte(message, "image/png");
        assertNotNull(logo);
        try (var expected = new ClassPathResource("email/NodeBank.png").getInputStream();
             var actual = logo.getInputStream()) {
            assertArrayEquals(expected.readAllBytes(), actual.readAllBytes());
        }
        Part htmlPart = encontrarParte(message, "text/html");
        assertNotNull(htmlPart);
        String sentHtml = (String) htmlPart.getContent();
        assertTrue(sentHtml.contains("href=\"https://nodebank.example/confirmar-cadastro/abc\""));
        assertTrue(sentHtml.contains("src=\"cid:nodebank-logo\""));
        assertFalse(sentHtml.contains("24 horas"));
    }

    private Part encontrarParte(Part part, String type) throws Exception {
        if (part.isMimeType(type)) return part;
        if (part.getContent() instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                Part result = encontrarParte(multipart.getBodyPart(i), type);
                if (result != null) return result;
            }
        }
        return null;
    }
}
