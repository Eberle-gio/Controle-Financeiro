package controle_financeiro.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import controle_financeiro.backend.service.RateLimitService;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HashMap;
import java.util.Map;

/** Limite por IP obtido da conexão; não confia em X-Forwarded-For enviado pelo cliente. */
@Component
public class SensitiveRouteLimitFilter extends OncePerRequestFilter {
    private final Map<String, Window> windows = new HashMap<>();
    private final Clock clock;
    private final RateLimitService persistentRateLimit;
    private long lastCleanup;

    @Autowired
    public SensitiveRouteLimitFilter(RateLimitService persistentRateLimit) {
        this.clock = Clock.systemUTC();
        this.persistentRateLimit = persistentRateLimit;
    }
    public SensitiveRouteLimitFilter() { this(Clock.systemUTC()); }
    public SensitiveRouteLimitFilter(Clock clock) {
        this.clock = clock;
        this.persistentRateLimit = null;
    }
    private record Window(long until, int count) {}

    synchronized long retryAfter(String key, int limit, long duration) {
        long now = clock.millis();
        if (now - lastCleanup >= 60_000) {
            windows.entrySet().removeIf(entry -> entry.getValue().until() <= now);
            lastCleanup = now;
        }
        Window previous = windows.get(key);
        if (previous == null || previous.until() <= now) {
            if (previous == null && windows.size() >= 10_000) return 60;
            windows.put(key, new Window(now + duration, 1));
            return 0;
        }
        if (previous.count() >= limit) return Math.max(1, (previous.until() - now + 999) / 1000);
        windows.put(key, new Window(previous.until(), previous.count() + 1));
        return 0;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getServletPath();
        int limit = switch (path) {
            case "/api/auth/login", "/api/auth/reset-password" -> 10;
            case "/api/auth/register", "/api/auth/forgot-password", "/api/auth/resend-confirmation" -> 5;
            default -> 0;
        };
        boolean aiInsight = path.matches("/api/v1/wallets/\\d+/insights");
        if (aiInsight) limit = 5;
        boolean invite = path.matches("/api/v1/wallets/\\d+/(invitations|members)");
        if (invite) limit = 30;
        if (limit > 0 && "POST".equals(request.getMethod())) {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            boolean authenticatedUser = auth != null && auth.isAuthenticated()
                    && !"anonymousUser".equals(auth.getName());
            String identity = (invite || aiInsight) && authenticatedUser ? auth.getName() : request.getRemoteAddr();
            String routeKey = aiInsight ? "ai-insights" : invite ? "wallet-invitations" : path;
            String key = routeKey + ":" + identity;
            long retry = persistentRateLimit == null
                    ? retryAfter(key, limit, 15 * 60_000L)
                    : persistentRateLimit.retryAfter(hashKey(key), limit, 15 * 60_000L);
            if (retry > 0) {
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(retry));
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"status\":429,\"message\":\"Muitas tentativas. Aguarde antes de tentar novamente.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private String hashKey(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível.", exception);
        }
    }
}
