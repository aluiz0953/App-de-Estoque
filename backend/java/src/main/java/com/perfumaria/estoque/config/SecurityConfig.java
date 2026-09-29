package com.perfumaria.estoque.config;

import com.perfumaria.estoque.model.Usuario.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.Cookie.SameSite;
import org.springframework.boot.web.servlet.server.CookieSameSiteSupplier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.UUID;

/**
 * Security configuration for the Perfume Inventory Management System.
 * Implements role-based access control and logs access to sensitive operations
 * for audit purposes as required by corporate compliance.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    // Signs the "manter conectado" cookie. Must be stable across restarts or every
    // redeploy invalidates everyone's cookie - set it once in the environment.
    @Value("${REMEMBER_ME_KEY:}")
    private String rememberMeKey;

    @Value("${COOKIE_SECURE:false}")
    private boolean cookieSecure;

    @Value("${COOKIE_SAME_SITE:lax}")
    private String cookieSameSite;

    private final UserDetailsService userDetailsService;
    private final AuditLogFilter auditLogFilter;

    public SecurityConfig(UserDetailsService userDetailsService, AuditLogFilter auditLogFilter) {
        this.userDetailsService = userDetailsService;
        this.auditLogFilter = auditLogFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Plain 401, no `WWW-Authenticate: Basic` challenge - that header made the
        // browser pop its own native username/password dialog over the web app
        // every time a session expired. The apps handle 401 themselves.
        AuthenticationEntryPoint unauthorized = new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED);

        http
            // Disable CSRF for simplicity in this example (in production, configure properly)
            .csrf(csrf -> csrf.disable())

            // The frontend (Vite dev server, port 5173) calls this API (port 8080) from a
            // different origin and sends cookies (credentials: 'include'), so it needs an
            // explicit allow-listed origin + allowCredentials — "*" is rejected by browsers
            // whenever credentials are involved.
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Authorize HTTP requests
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers("/api/produtos/sku/**", "/api/produtos/{id}/margem-lucro").permitAll()
                // Must come before the /api/auth/** permitAll below - first match wins.
                .requestMatchers("/api/auth/profile").authenticated()
                .requestMatchers("/api/auth/**").permitAll()

                // Protected endpoints - Role-based access
                .requestMatchers("/api/estoque/**").hasAnyRole(Role.ADMIN.name(), Role.OPERATOR.name(), Role.MANAGER.name())
                .requestMatchers("/api/produtos/**", "/api/marcas/**", "/api/linhas/**").hasAnyRole(Role.ADMIN.name(), Role.MANAGER.name())
                .requestMatchers("/api/notificacoes/**").hasAnyRole(Role.ADMIN.name(), Role.AUDITOR.name(), Role.MANAGER.name())
                // Confirming a pedido withdraws stock, same as /api/estoque/** - same roles.
                .requestMatchers("/api/pedidos/**", "/api/clientes/**").hasAnyRole(Role.ADMIN.name(), Role.OPERATOR.name(), Role.MANAGER.name())

                // Admin-only endpoints
                .requestMatchers("/api/usuarios/**").hasRole(Role.ADMIN.name())

                // All other endpoints require authentication
                .anyRequest().authenticated()
            )

            // No formLogin(): AuthController handles /api/auth/login itself. Registering a
            // formLogin here (even just to permitAll it) makes Spring Security's own
            // UsernamePasswordAuthenticationFilter claim POST /api/auth/login first,
            // since loginPage() doubles as the default loginProcessingUrl — the
            // controller method would never actually run.

            // Logout - 200 instead of the default redirect to /login?logout, which the
            // API doesn't have. Also clears the remember-me cookie (rememberMe below
            // registers itself as a logout handler).
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler())
                .permitAll()
            )

            // "Manter conectado": sessions are in-memory and die on every redeploy;
            // this cookie re-authenticates the next request after one. Only issued
            // when AuthController#login is asked to.
            .rememberMe(rm -> rm.rememberMeServices(rememberMeServices()))

            // HTTP Basic for API clients (optional)
            .httpBasic(basic -> basic.authenticationEntryPoint(unauthorized))
            .exceptionHandling(e -> e.authenticationEntryPoint(unauthorized))

            // Add custom audit filter to log access to sensitive operations
            .addFilterBefore(auditLogFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(authProvider);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public TokenBasedRememberMeServices rememberMeServices() {
        String key = rememberMeKey;
        if (key.isBlank()) {
            // ponytail: random per boot - "manter conectado" works but won't survive a
            // restart until REMEMBER_ME_KEY is set in the environment.
            key = UUID.randomUUID().toString();
            log.warn("REMEMBER_ME_KEY not set: 'manter conectado' will not survive a restart");
        }
        TokenBasedRememberMeServices services = new TokenBasedRememberMeServices(key, userDetailsService);
        services.setTokenValiditySeconds(30 * 24 * 60 * 60);
        // AuthController only calls loginSuccess() when the user opted in, so there's
        // no form parameter to look for.
        services.setAlwaysRemember(true);
        services.setUseSecureCookie(cookieSecure);
        return services;
    }

    // The session cookie gets its SameSite from server.servlet.session.cookie.same-site;
    // the remember-me cookie needs the same, or a cross-site web frontend never sends it.
    @Bean
    public CookieSameSiteSupplier rememberMeCookieSameSite() {
        return CookieSameSiteSupplier.of(SameSite.valueOf(cookieSameSite.toUpperCase())).whenHasName("remember-me");
    }

    // Comma-separated list, e.g. "https://estoque-tico-e-tica.onrender.com" in production.
    // Defaults to the Vite dev server origin so local development keeps working unset.
    @org.springframework.beans.factory.annotation.Value("${ALLOWED_ORIGINS:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}