package controle_financeiro.backend.service;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.annotation.PreDestroy;

@Service
public class CarteiraRealtimeService {
    private final ConcurrentMap<Long, Set<SseEmitter>> assinantes = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeat = Executors.newSingleThreadScheduledExecutor(task -> {
        Thread thread = new Thread(task, "wallet-sse-heartbeat");
        thread.setDaemon(true);
        return thread;
    });

    public record TransacaoAlterada(Long walletId, String action) {}

    public SseEmitter assinar(Long walletId) {
        SseEmitter emitter = new SseEmitter(0L);
        Set<SseEmitter> carteiraAssinantes = assinantes.compute(walletId, (ignored, atuais) -> {
            Set<SseEmitter> assinantesAtuais = atuais == null ? ConcurrentHashMap.newKeySet() : atuais;
            assinantesAtuais.add(emitter);
            return assinantesAtuais;
        });

        AtomicReference<ScheduledFuture<?>> heartbeatTask = new AtomicReference<>();
        Runnable remover = () -> {
            ScheduledFuture<?> task = heartbeatTask.get();
            if (task != null) task.cancel(false);
            carteiraAssinantes.remove(emitter);
            removerConjuntoVazio(walletId, carteiraAssinantes);
        };
        emitter.onCompletion(remover);
        emitter.onTimeout(() -> {
            emitter.complete();
            remover.run();
        });
        emitter.onError(ignored -> remover.run());

        heartbeatTask.set(heartbeat.scheduleAtFixedRate(() -> enviarHeartbeat(emitter), 20, 20, TimeUnit.SECONDS));
        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException error) {
            emitter.completeWithError(error);
            remover.run();
        }
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aoAlterarTransacao(TransacaoAlterada evento) {
        Set<SseEmitter> carteiraAssinantes = assinantes.get(evento.walletId());
        if (carteiraAssinantes == null) return;

        for (SseEmitter emitter : carteiraAssinantes) {
            try {
                emitter.send(SseEmitter.event().name("transaction-changed").data(evento));
            } catch (IOException | IllegalStateException error) {
                emitter.completeWithError(error);
                carteiraAssinantes.remove(emitter);
            }
        }
        removerConjuntoVazio(evento.walletId(), carteiraAssinantes);
    }

    private void removerConjuntoVazio(Long walletId, Set<SseEmitter> conjunto) {
        assinantes.computeIfPresent(walletId, (ignored, atuais) ->
                atuais == conjunto && atuais.isEmpty() ? null : atuais);
    }

    private void enviarHeartbeat(SseEmitter emitter) {
        try {
            emitter.send(SseEmitter.event().comment("keep-alive"));
        } catch (IOException | IllegalStateException error) {
            emitter.completeWithError(error);
        }
    }

    @PreDestroy
    public void encerrar() {
        heartbeat.shutdownNow();
        assinantes.values().forEach(emissores -> emissores.forEach(SseEmitter::complete));
        assinantes.clear();
    }
}
