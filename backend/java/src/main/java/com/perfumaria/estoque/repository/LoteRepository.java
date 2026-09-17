package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Lote;
import com.perfumaria.estoque.model.Produto;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository for Lote entity.
 * Provides CRUD operations and custom queries for inventory lot management.
 * Includes specialized methods for FIFO inventory logic.
 */
@RepositoryRestResource(exported = false) // stock mutations must go through InventoryController, not raw REST CRUD
public interface LoteRepository extends JpaRepository<Lote, Long> {

    // Find by product
    List<Lote> findByProduto(Produto produto);

    List<Lote> findByProdutoId(Long produtoId);

    // Find by expiration date (for FEFO - First Expired, First Out)
    List<Lote> findByDataValidadeBetween(LocalDate startDate, LocalDate endDate);

    List<Lote> findByDataValidadeLessThanEqual(LocalDate date);

    List<Lote> findByDataValidadeGreaterThanEqual(LocalDate date);

    // Find active lots for a product ordered by expiration date (FEFO - First Expired, First Out)
    @Query("SELECT l FROM Lote l WHERE l.produto.id = :produtoId AND l.status = 'ATIVO' ORDER BY l.dataValidade ASC")
    List<Lote> findActiveLotesByProdutoOrderByExpiration(@Param("produtoId") Long produtoId);

    // Find active lots for a product ordered by receipt date, oldest first (true FIFO - First-In, First-Out)
    @Query("SELECT l FROM Lote l WHERE l.produto.id = :produtoId AND l.status = 'ATIVO' ORDER BY l.criadoEm ASC")
    List<Lote> findActiveLotesByProdutoOrderByReceiptAsc(@Param("produtoId") Long produtoId);

    // Find active lots for a product ordered by receipt date, newest first (LIFO - Last-In, First-Out)
    @Query("SELECT l FROM Lote l WHERE l.produto.id = :produtoId AND l.status = 'ATIVO' ORDER BY l.criadoEm DESC")
    List<Lote> findActiveLotesByProdutoOrderByReceiptDesc(@Param("produtoId") Long produtoId);

    // Find lots by number
    List<Lote> findByNumeroLoteContainingIgnoreCase(String numeroLote);

    // Count active lots for a product
    Long countByProdutoAndStatus(Produto produto, Lote.StatusLote status);

    // Count lots by status (dashboard summary)
    long countByStatus(Lote.StatusLote status);

    // All lots with a given status (dashboard summary totals)
    List<Lote> findByStatus(Lote.StatusLote status);

    // Find lots expiring within a date range, excluding a given status
    List<Lote> findByDataValidadeBetweenAndStatusNot(LocalDate startDate, LocalDate endDate, Lote.StatusLote status);

    // Find lots already past a date, excluding a given status
    List<Lote> findByDataValidadeLessThanEqualAndStatusNot(LocalDate date, Lote.StatusLote status);

    // Custom query to get total quantity of active lots for a product
    @Query("SELECT SUM(l.quantidade) FROM Lote l WHERE l.produto.id = :produtoId AND l.status = 'ATIVO'")
    Integer getTotalQuantityByProdutoId(@Param("produtoId") Long produtoId);

    // Methods for FIFO logic
    @Modifying
    @Transactional
    @Query("UPDATE Lote l SET l.quantidade = l.quantidade - :quantidade WHERE l.id = :loteId")
    int reduceQuantity(@Param("loteId") Long loteId, @Param("quantidade") int quantidade);
}