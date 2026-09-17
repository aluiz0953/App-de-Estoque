package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Usuario;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Usuario entity.
 * Provides CRUD operations and custom queries for user management.
 */
@RepositoryRestResource(exported = false) // never expose staff accounts via unauthenticated root-level REST CRUD
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    Optional<Usuario> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    // Active users with any of the given roles (used to pick email recipients)
    List<Usuario> findByRoleInAndActiveTrue(List<Usuario.Role> roles);
}