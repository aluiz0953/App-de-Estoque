package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Usuario;
import com.perfumaria.estoque.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only user management (see SecurityConfig: /api/usuarios/** is ROLE_ADMIN only)
 * — backs the Usuarios tab's team list, including approving/rejecting accounts
 * created through public self-registration (AuthController#register).
 */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Usuario> getAllUsuarios() {
        return usuarioRepository.findAll();
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<Usuario> activate(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    usuario.setActive(true);
                    return ResponseEntity.ok(usuarioRepository.save(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Deactivates an existing (previously-approved) account. Soft, not a delete,
     * so lote/audit history tied to this user (criadoPor/atualizadoPor) doesn't
     * break its FK.
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Usuario> deactivate(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    usuario.setActive(false);
                    return ResponseEntity.ok(usuarioRepository.save(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Rejects a pending self-registration outright. A never-approved account has
     * no lote/audit history yet, so a hard delete is safe here - if it did have
     * FK-linked history (i.e. this wasn't actually a fresh signup), the delete
     * fails with a conflict instead of an opaque 500.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> reject(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            usuarioRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409).build();
        }
        return ResponseEntity.noContent().build();
    }
}
