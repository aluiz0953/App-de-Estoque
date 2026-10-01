package com.perfumaria.estoque.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-address request throttle: a general cap on every endpoint, plus a tighter one on
 * POST /api/auth/login (LoginAttemptService only locks one username from one address, it
 * doesn't stop a single address spraying many usernames). Over the cap the request is
 * refused with 429 + Retry-After before it reaches authentication or the database.
 * In-memory on purpose (single instance); move to a shared store if the API is ever scaled
 * to several instances.
 * ponytail: fixed one-minute window, so a client can burst up to 2x the limit across a
 * window boundary; switch to a token bucket if that ever matters.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;
    private static final int PURGE_THRESHOLD = 10_000;

    private record Window(long start, int count) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final int limit;
    private final int loginLimit;
    private final Clock clock;
    private volatile long lastPurge;

    public RateLimitFilter(int limit, int loginLimit) {
        this(limit, loginLimit, Clock.systemUTC());
    }

    RateLimitFilter(int limit, int loginLimit, Clock clock) {
        this.limit = limit;
        this.loginLimit = loginLimit;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String ip = AuditLogFilter.clientIp(request);
        boolean login = "POST".equals(request.getMethod()) && "/api/auth/login".equals(request.getRequestURI());
        long retryAfter = Math.max(hit("api|" + ip, limit), login ? hit("login|" + ip, loginLimit) : 0);
        if (retryAfter > 0) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Muitas requisições. Tente novamente em instantes.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    /** Counts one request; returns 0 if allowed, else the seconds until the window resets. */
    private long hit(String key, int max) {
        long now = clock.millis();
        if (windows.size() > PURGE_THRESHOLD && now - lastPurge >= 1_000) {
            lastPurge = now;
            windows.values().removeIf(w -> now - w.start() >= WINDOW_MILLIS);
        }
        Window w = windows.merge(key, new Window(now, 1), (old, ignored) ->
                now - old.start() >= WINDOW_MILLIS ? new Window(now, 1) : new Window(old.start(), old.count() + 1));
        return w.count() > max ? (w.start() + WINDOW_MILLIS - now + 999) / 1000 : 0;
    }
}
