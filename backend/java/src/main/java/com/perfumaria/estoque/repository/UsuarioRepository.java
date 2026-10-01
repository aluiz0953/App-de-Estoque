package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Usuario;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Usuario entity.
 * Provides CRUD operations and custom queries for user management.
 */
@RepositoryRestResource(exported = false) // never expose staff accounts via unauthenticated root-level REST CRUD
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Case-insensitive on purpose: MySQL compared text that way and the mobile keyboard sends the
    // username lower-cased (autoCapitalize="none"); PostgreSQL is case-sensitive, so "andré" would
    // no longer find "André".
    @Query("select u from Usuario u where lower(u.username) = lower(:username)")
    Optional<Usuario> findByUsername(@Param("username") String username);

    @Query("select u from Usuario u where lower(u.email) = lower(:email)")
    Optional<Usuario> findByEmail(@Param("email") String email);

    @Query("select count(u) > 0 from Usuario u where lower(u.username) = lower(:username)")
    boolean existsByUsername(@Param("username") String username);

    @Query("select count(u) > 0 from Usuario u where lower(u.email) = lower(:email)")
    boolean existsByEmail(@Param("email") String email);

    // Active users with any of the given roles (used to pick email recipients)
    List<Usuario> findByRoleInAndActiveTrue(List<Usuario.Role> roles);
}