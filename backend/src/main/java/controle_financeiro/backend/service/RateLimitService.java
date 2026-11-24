package controle_financeiro.backend.service;

import controle_financeiro.backend.model.RateLimitWindow;
import controle_financeiro.backend.repository.RateLimitWindowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class RateLimitService {
    private static final long CLEANUP_INTERVAL_MS = 15 * 60_000L;
    private static final long RETENTION_MS = 24 * 60 * 60_000L;

    private final RateLimitWindowRepository repository;
    private final Clock clock;
    private final AtomicLong nextCleanupAt = new AtomicLong();

    @Autowired
    public RateLimitService(RateLimitWindowRepository repository) {
        this(repository, Clock.systemUTC());
    }

    RateLimitService(RateLimitWindowRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public long retryAfter(String key, int limit, long duration) {
        long now = clock.millis();
        long scheduledCleanup = nextCleanupAt.get();
        if (now >= scheduledCleanup && nextCleanupAt.compareAndSet(scheduledCleanup, now + CLEANUP_INTERVAL_MS)) {
            repository.deleteOlderThan(now - RETENTION_MS);
        }

        repository.ensureWindow(key, now);
        RateLimitWindow window = repository.findByKeyForUpdate(key)
                .orElseThrow(() -> new IllegalStateException("Janela de limite não encontrada."));
        if (now - window.getWindowStartedAt() >= duration) {
            window.setWindowStartedAt(now);
            window.setRequestCount(1);
            return 0;
        }
        if (window.getRequestCount() >= limit) {
            return Math.max(1, (window.getWindowStartedAt() + duration - now + 999) / 1000);
        }
        window.setRequestCount(window.getRequestCount() + 1);
        return 0;
    }
}
