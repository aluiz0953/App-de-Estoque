package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Linha;
import com.perfumaria.estoque.model.Marca;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

/**
 * Repository for Linha entity.
 * Provides CRUD operations and custom queries for product line management.
 */
@RepositoryRestResource(exported = false) // no controller fronts this — don't auto-expose it unauthenticated at root
public interface LinhaRepository extends JpaRepository<Linha, Long> {

    Linha findByMarcaAndNome(Marca marca, String nome);

    List<Linha> findByMarcaId(Long marcaId);
}