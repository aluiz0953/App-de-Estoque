package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Produto;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Repository for Produto entity.
 * Provides CRUD operations and custom queries for product management.
 */
@RepositoryRestResource
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    Produto findBySku(String sku);

    Produto findByBarcodeEan13(String barcodeEan13);

    Produto findByBarcodeUpc(String barcodeUpc);

    boolean existsBySku(String sku);

    boolean existsByBarcodeEan13(String barcodeEan13);

    boolean existsByBarcodeUpc(String barcodeUpc);
}