package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.RateLimitWindow;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RateLimitWindowRepository extends JpaRepository<RateLimitWindow, String> {
    @Modifying
    @Query(value = "INSERT IGNORE INTO rate_limit_windows (rate_key, window_started_at, request_count) VALUES (:key, :now, 0)", nativeQuery = true)
    int ensureWindow(@Param("key") String key, @Param("now") long now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from RateLimitWindow w where w.key = :key")
    Optional<RateLimitWindow> findByKeyForUpdate(@Param("key") String key);

    @Modifying
    @Query("delete from RateLimitWindow w where w.windowStartedAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") long cutoff);
}
