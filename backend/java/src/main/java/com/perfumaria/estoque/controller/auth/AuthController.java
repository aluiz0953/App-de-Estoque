package com.perfumaria.estoque.controller.auth;

import com.perfumaria.estoque.model.Usuario;
import com.perfumaria.estoque.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for authentication operations (login/logout).
 * Provides endpoints for user authentication as required by the security specifications.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    /**
     * Login endpoint.
     * Authenticates user with username and password.
     *
     * @param credentials Map containing username and password
     * @return Authentication success response
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials,
                                                       HttpServletRequest request,
                                                       HttpServletResponse response) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        // Spring Security 6's SecurityContextHolderFilter does not persist a context set
        // mid-request on its own (unlike the old SecurityContextPersistenceFilter) — it
        // has to be saved into the session explicitly, or the next request comes in anonymous.
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado após autenticação"));

        Map<String, Object> body = new HashMap<>();
        body.put("authenticated", true);
        body.put("user", usuario.getUsername());
        body.put("role", usuario.getRole().toString());
        body.put("message", "Login realizado com sucesso");

        return ResponseEntity.ok(body);
    }

    /**
     * Logout endpoint.
     * Clears the security context.
     *
     * @return Logout success response
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        SecurityContextHolder.clearContext();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout realizado com sucesso");

        return ResponseEntity.ok(response);
    }

    /**
     * Register a new user (admin function).
     * In a real application, this would be more restricted.
     *
     * @param usuario User data to register
     * @return Registered user
     */
    @PostMapping("/register")
    public ResponseEntity<Usuario> register(@RequestBody Usuario usuario) {
        // Check if user already exists
        if (usuarioRepository.findByUsername(usuario.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(null);
        }

        // Encode password
        usuario.setPasswordHash(passwordEncoder.encode(usuario.getPasswordHash()));
        usuario.setRole(usuario.getRole() != null ? usuario.getRole() : Usuario.Role.OPERATOR);

        Usuario savedUser = usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }
}