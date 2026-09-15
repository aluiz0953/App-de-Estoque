package com.perfumaria.estoque.config;

import com.perfumaria.estoque.model.Usuario;
import com.perfumaria.estoque.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * Custom UserDetailsService that loads user-specific data for Spring Security.
 * Used in conjunction with the SecurityConfig for authentication.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));

        return new User(
                usuario.getUsername(),
                usuario.getPasswordHash(),
                true, // enabled
                true, // accountNotExpired
                true, // credentialsNotExpired
                true, // accountNotLocked
                // In a real app, we would map the Usuario role to GrantedAuthority
                // For simplicity, we're using a basic approach here
                new ArrayList<>()
        );
    }
}