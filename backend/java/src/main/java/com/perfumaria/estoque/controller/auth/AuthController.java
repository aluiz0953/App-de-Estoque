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

        // authenticate() already loaded the Usuario once (UserDetailsServiceImpl) and its
        // role is right there in the granted authorities - re-querying it here was a second
        // round trip to the DB for data already in hand, doubling login latency for nothing.
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replaceFirst("^ROLE_", ""))
                .orElseThrow(() -> new RuntimeException("Usuário sem papel definido"));

        Map<String, Object> body = new HashMap<>();
        body.put("authenticated", true);
        body.put("user", authentication.getName());
        body.put("role", role);
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
     * Returns the currently authenticated user's profile.
     *
     * @return Authenticated Usuario (passwordHash is write-only and never serialized)
     */
    @GetMapping("/profile")
    public ResponseEntity<Usuario> profile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário autenticado não encontrado: " + username));
        return ResponseEntity.ok(usuario);
    }

    /**
     * Public self-registration. The account is created inactive - an ADMIN must
     * approve it (see UsuarioController#activate) before it can log in. Role and
     * active are never taken from the request body: an anonymous caller must not
     * be able to hand themselves ADMIN or a pre-approved account.
     *
     * @param usuario User data to register
     * @return Success message (no account details - the caller isn't authenticated yet)
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody Usuario usuario) {
        if (usuarioRepository.findByUsername(usuario.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Usuário já existe"));
        }
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "E-mail já cadastrado"));
        }

        usuario.setPasswordHash(passwordEncoder.encode(usuario.getPasswordHash()));
        usuario.setRole(Usuario.Role.OPERATOR);
        usuario.setActive(false);

        usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Conta criada. Aguarde um administrador liberar seu acesso."));
    }
}