package controle_financeiro.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rate_limit_windows")
public class RateLimitWindow {
    @Id
    @Column(name = "rate_key", length = 64, nullable = false)
    private String key;

    @Column(name = "window_started_at", nullable = false)
    private long windowStartedAt;

    @Column(name = "request_count", nullable = false)
    private int requestCount;

    protected RateLimitWindow() {}

    public RateLimitWindow(String key, long windowStartedAt, int requestCount) {
        this.key = key;
        this.windowStartedAt = windowStartedAt;
        this.requestCount = requestCount;
    }

    public String getKey() { return key; }
    public long getWindowStartedAt() { return windowStartedAt; }
    public int getRequestCount() { return requestCount; }
    public void setWindowStartedAt(long windowStartedAt) { this.windowStartedAt = windowStartedAt; }
    public void setRequestCount(int requestCount) { this.requestCount = requestCount; }
}
