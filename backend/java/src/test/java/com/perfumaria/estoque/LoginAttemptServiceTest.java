package com.perfumaria.estoque;

import com.perfumaria.estoque.controller.auth.LoginAttemptService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Plain unit test: no Spring context, no database. */
class LoginAttemptServiceTest {

    @Test
    void blocksAfterFiveFailuresAndSuccessResets() {
        LoginAttemptService service = new LoginAttemptService();
        String key = LoginAttemptService.key(" Admin ", "1.2.3.4");
        assertEquals(LoginAttemptService.key("admin", "1.2.3.4"), key);

        for (int i = 0; i < 4; i++) service.recordFailure(key);
        assertFalse(service.isBlocked(key));
        service.recordFailure(key);
        assertTrue(service.isBlocked(key));

        // A different address is not locked out by someone else's guesses.
        assertFalse(service.isBlocked(LoginAttemptService.key("admin", "5.6.7.8")));

        service.recordSuccess(key);
        assertFalse(service.isBlocked(key));
    }
}
