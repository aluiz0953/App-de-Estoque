package com.perfumaria.estoque.config;

import com.perfumaria.estoque.model.AuditLog;
import com.perfumaria.estoque.repository.AuditLogRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Audit log filter that records access to sensitive operations
 * for corporate compliance and auditing purposes.
 * Specifically logs access to login screens and manual stock adjustments
 * as required by the security requirements.
 */
@Component
public class AuditLogFilter implements Filter {

    @Autowired
    private AuditLogRepository auditLogRepository;

    // Paths that require audit logging
    private static final String[] AUDITED_PATHS = {
        "/api/auth/login",
        "/api/estoque/**",  // All stock operations (entrada/saída manual)
        "/api/produtos/**", // Product modifications
        "/api/usuarios/**"  // User management
    };

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        String path = request.getRequestURI();
        String method = request.getMethod();
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");

        // Check if this path should be audited
        boolean shouldAudit = false;
        for (String auditedPath : AUDITED_PATHS) {
            if (path.matches(auditedPath.replace("**", ".*"))) {
                shouldAudit = true;
                break;
            }
        }

        // Continue with the filter chain
        filterChain.doFilter(servletRequest, servletResponse);

        // Log the access after the request is processed (to capture response status if needed)
        if (shouldAudit) {
            AuditLog auditLog = new AuditLog();
            auditLog.setEndpoint(path);
            auditLog.setMethod(method);
            auditLog.setIpAddress(ipAddress);
            auditLog.setUserAgent(userAgent);
            auditLog.setAccessTime(LocalDateTime.now());
            // In a real implementation, we would extract the authenticated user from the security context
            // auditLog.setUsuario(authenticatedUser);
            auditLogRepository.save(auditLog);
        }
    }

    /**
     * Extracts the client IP address from the request, considering proxies and load balancers.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}