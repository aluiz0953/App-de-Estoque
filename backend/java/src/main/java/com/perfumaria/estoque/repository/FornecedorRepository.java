package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Fornecedor;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Repository for Fornecedor entity.
 * Provides CRUD operations and custom queries for supplier management.
 */
@RepositoryRestResource(exported = false) // no controller fronts this — don't auto-expose it unauthenticated at root
public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {

    Fornecedor findByCnpj(String cnpj);

    boolean existsByCnpj(String cnpj);
}