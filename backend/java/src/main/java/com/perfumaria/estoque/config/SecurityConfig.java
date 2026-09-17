package com.perfumaria.estoque.config;

import com.perfumaria.estoque.model.Usuario.Role;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Security configuration for the Perfume Inventory Management System.
 * Implements role-based access control and logs access to sensitive operations
 * for audit purposes as required by corporate compliance.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final AuditLogFilter auditLogFilter;

    public SecurityConfig(UserDetailsService userDetailsService, AuditLogFilter auditLogFilter) {
        this.userDetailsService = userDetailsService;
        this.auditLogFilter = auditLogFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
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
                .requestMatchers("/api/auth/**").permitAll()

                // Protected endpoints - Role-based access
                .requestMatchers("/api/estoque/**").hasAnyRole(Role.ADMIN.name(), Role.OPERATOR.name(), Role.MANAGER.name())
                .requestMatchers("/api/produtos/**").hasAnyRole(Role.ADMIN.name(), Role.MANAGER.name())
                .requestMatchers("/api/notificacoes/**").hasAnyRole(Role.ADMIN.name(), Role.AUDITOR.name(), Role.MANAGER.name())

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

            // Logout
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .permitAll()
            )

            // HTTP Basic for API clients (optional)
            .httpBasic(Customizer.withDefaults())

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
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}