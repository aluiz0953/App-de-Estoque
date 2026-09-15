package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Usuario;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Repository for Usuario entity.
 * Provides CRUD operations and custom queries for user management.
 */
@RepositoryRestResource
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Usuario findByUsername(String username);

    Usuario findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}