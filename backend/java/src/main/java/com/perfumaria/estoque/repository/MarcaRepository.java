package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Marca;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Repository for Marca entity.
 * Provides CRUD operations and custom queries for brand management.
 */
@RepositoryRestResource
public interface MarcaRepository extends JpaRepository<Marca, Long> {

    Marca findByNome(String nome);

    boolean existsByNome(String nome);
}