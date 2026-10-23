package controle_financeiro.backend.service;

import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.event.TransactionalEventListener;
import org.thymeleaf.context.Context;

@Component
public class ConviteEmailListener {
    private final EmailService emailService;
    public ConviteEmailListener(EmailService emailService) { this.emailService = emailService; }
    @Async
    @TransactionalEventListener
    public void enviar(ConviteCarteiraService.ConvitePendente evento) {
        Context context = new Context();
        context.setVariable("carteira", evento.carteira());
        context.setVariable("dono", evento.dono());
        context.setVariable("inviteUrl", evento.link());
        emailService.emailTemplate(evento.email(), "Convite para uma carteira no NodeBank", context, "conviteCarteira");
    }
}
