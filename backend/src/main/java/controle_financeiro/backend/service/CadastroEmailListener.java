package controle_financeiro.backend.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.thymeleaf.context.Context;

@Component
public class CadastroEmailListener {
    private final EmailService emailService;

    public CadastroEmailListener(EmailService emailService) {
        this.emailService = emailService;
    }

    @Async
    @TransactionalEventListener
    public void enviar(ConfirmacaoCadastroService.CadastroPendente evento) {
        Context context = new Context();
        context.setVariable("name", evento.nome());
        context.setVariable("confirmUrl", evento.confirmUrl());
        emailService.emailTemplate(evento.email(), "Confirme seu cadastro no NodeBank", context, "novoCadastro");
    }
}
