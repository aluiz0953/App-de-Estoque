package com.perfumaria.estoque.controller.auth;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Throttles password guessing on /api/auth/login: after MAX_FAILURES wrong attempts
 * for the same username from the same address, further attempts are refused until
 * the lock expires. In-memory on purpose (single instance); move to a shared store
 * if the API is ever scaled to several instances.
 */
@Component
public class LoginAttemptService {

    static final int MAX_FAILURES = 5;
    static final long LOCK_MILLIS = 15 * 60_000L;
    private static final int PURGE_THRESHOLD = 10_000;

    private record Entry(int failures, long lastFailureAt) {}

    private final ConcurrentHashMap<String, Entry> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptService() {
        this(Clock.systemUTC());
    }

    LoginAttemptService(Clock clock) {
        this.clock = clock;
    }

    public static String key(String username, String remoteAddr) {
        return (username == null ? "" : username.trim().toLowerCase(Locale.ROOT)) + "|" + remoteAddr;
    }

    public boolean isBlocked(String key) {
        Entry entry = attempts.get(key);
        if (entry == null) return false;
        if (clock.millis() - entry.lastFailureAt() >= LOCK_MILLIS) {
            attempts.remove(key, entry);
            return false;
        }
        return entry.failures() >= MAX_FAILURES;
    }

    public void recordFailure(String key) {
        long now = clock.millis();
        if (attempts.size() > PURGE_THRESHOLD) {
            attempts.values().removeIf(e -> now - e.lastFailureAt() >= LOCK_MILLIS);
        }
        attempts.merge(key, new Entry(1, now), (old, ignored) ->
                now - old.lastFailureAt() >= LOCK_MILLIS ? new Entry(1, now) : new Entry(old.failures() + 1, now));
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }
}
