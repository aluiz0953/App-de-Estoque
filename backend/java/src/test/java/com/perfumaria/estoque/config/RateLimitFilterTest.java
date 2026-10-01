package com.perfumaria.estoque.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/** Plain unit test: no Spring context, no database. */
class RateLimitFilterTest {

    private static class TestClock extends Clock {
        long now;
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return Instant.ofEpochMilli(now); }
    }

    private static int status(RateLimitFilter filter, String method, String uri, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.addHeader("X-Forwarded-For", ip + ", 10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        if (response.getStatus() == 429) assertNotNull(response.getHeader("Retry-After"));
        return response.getStatus();
    }

    @Test
    void generalLimitIsPerAddressAndResetsAfterTheWindow() throws Exception {
        TestClock clock = new TestClock();
        RateLimitFilter filter = new RateLimitFilter(3, 100, clock);

        for (int i = 0; i < 3; i++) assertEquals(200, status(filter, "GET", "/api/produtos", "1.1.1.1"));
        assertEquals(429, status(filter, "GET", "/api/produtos", "1.1.1.1"));
        assertEquals(200, status(filter, "GET", "/api/produtos", "2.2.2.2"));

        clock.now = 60_000;
        assertEquals(200, status(filter, "GET", "/api/produtos", "1.1.1.1"));
    }

    @Test
    void loginHasItsOwnTighterLimit() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(100, 2, new TestClock());

        assertEquals(200, status(filter, "POST", "/api/auth/login", "1.1.1.1"));
        assertEquals(200, status(filter, "POST", "/api/auth/login", "1.1.1.1"));
        assertEquals(429, status(filter, "POST", "/api/auth/login", "1.1.1.1"));
        // The rest of the API is still open for that address.
        assertEquals(200, status(filter, "GET", "/api/produtos", "1.1.1.1"));
    }
}
