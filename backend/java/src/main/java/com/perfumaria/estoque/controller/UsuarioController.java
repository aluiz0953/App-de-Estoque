package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Usuario;
import com.perfumaria.estoque.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only user listing (see SecurityConfig: /api/usuarios/** is ROLE_ADMIN only)
 * — backs the Usuarios tab's team list.
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
}
