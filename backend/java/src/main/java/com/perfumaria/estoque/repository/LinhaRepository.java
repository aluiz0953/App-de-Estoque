package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Linha;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Repository for Linha entity.
 * Provides CRUD operations and custom queries for product line management.
 */
@RepositoryRestResource
public interface LinhaRepository extends JpaRepository<Linha, Long> {

    Linha findByMarcaAndNome(Marca marca, String nome);
}