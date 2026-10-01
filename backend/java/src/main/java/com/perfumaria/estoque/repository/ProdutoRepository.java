package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Produto;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Produto entity.
 * Provides CRUD operations and custom queries for product management.
 */
@RepositoryRestResource(exported = false) // ProdutoController already fronts this at /api/produtos with proper margin logic
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findByLinhaId(Long linhaId);

    Optional<Produto> findBySku(String sku);

    Optional<Produto> findByBarcodeEan13(String barcodeEan13);

    Optional<Produto> findByBarcodeUpc(String barcodeUpc);

    boolean existsBySku(String sku);

    boolean existsByBarcodeEan13(String barcodeEan13);

    boolean existsByBarcodeUpc(String barcodeUpc);

    // Active products (used by scheduled stock-level checks)
    List<Produto> findByActiveTrue();

    // General quick-search across name/SKU/brand/line — backs the web search box and the
    // mobile "Entrada de Romaneio" autocomplete (busca rápida por Linha/Marca).
    // LEFT JOIN FETCH p.lotes: Produto#getQuantidadeTotal/getValorTotalEstoque/etc. all
    // read the lazy `lotes` collection, so without fetching it here too, serializing
    // the list triggers one more query per produto on top of linha/marca (see below).
    @Query("SELECT DISTINCT p FROM Produto p JOIN FETCH p.linha l JOIN FETCH l.marca m LEFT JOIN FETCH p.lotes WHERE " +
            "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.sku) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(l.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(m.nome) LIKE LOWER(CONCAT('%', :termo, '%'))")
    List<Produto> search(@Param("termo") String termo);

    // linha/marca are lazy @ManyToOne and lotes is a lazy @OneToMany, so a plain
    // findAll() triggers up to two extra queries per produto (N+1) when the response
    // gets serialized — linha/marca from the nested JSON, lotes from Produto's own
    // getQuantidadeTotal/getValorTotalEstoque/getQuantidadeVencida/etc. getters, which
    // all read `lotes` directly. Fine with a handful of seed products, but with the
    // real catalog (hundreds of produtos) each add-on query is a separate round trip
    // to the DB, which is what actually blew this past 60s, not the row count.
    @Query("SELECT DISTINCT p FROM Produto p JOIN FETCH p.linha l JOIN FETCH l.marca LEFT JOIN FETCH p.lotes WHERE p.active = true")
    List<Produto> findAllActiveWithLinhaAndMarca();

    // New methods for tipoProduto and fragrancia fields
    List<Produto> findByTipoProduto(String tipoProduto);

    List<Produto> findByFragrancia(String fragrancia);

    List<Produto> findByLinhaNome(String linhaNome);

    List<Produto> findByLinhaMarcaNome(String marcaNome);

    // Combined filter methods
    List<Produto> findByTipoProdutoAndLinhaNome(String tipoProduto, String linhaNome);

    List<Produto> findByTipoProdutoAndFragrancia(String tipoProduto, String fragrancia);

    List<Produto> findByLinhaNomeAndFragrancia(String linhaNome, String fragrancia);

    List<Produto> findByTipoProdutoAndLinhaNomeAndFragrancia(String tipoProduto, String linhaNome, String fragrancia);

    List<Produto> findByLinhaMarcaNomeAndTipoProduto(String marcaNome, String tipoProduto);

    List<Produto> findByLinhaMarcaNomeAndLinhaNome(String marcaNome, String linhaNome);

    // Partial match methods (case insensitive)
    List<Produto> findByTipoProdutoContainingIgnoreCase(String tipoProduto);

    List<Produto> findByFragranciaContainingIgnoreCase(String fragrancia);

    List<Produto> findByLinhaNomeContainingIgnoreCase(String linhaNome);

    List<Produto> findByLinhaMarcaNomeContainingIgnoreCase(String marcaNome);

    // Combined partial match methods
    List<Produto> findByTipoProdutoContainingIgnoreCaseAndLinhaNomeContainingIgnoreCase(
            String tipoProduto, String linhaNome);

    List<Produto> findByTipoProdutoContainingIgnoreCaseAndFragranciaContainingIgnoreCase(
            String tipoProduto, String fragrancia);

    List<Produto> findByLinhaNomeContainingIgnoreCaseAndFragranciaContainingIgnoreCase(
            String linhaNome, String fragrancia);
}