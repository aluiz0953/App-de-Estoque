package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.repository.ProdutoRepository;
import com.perfumaria.estoque.service.ProfitMarginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Produto entity.
 * Exposes endpoints for product management including profit margin calculations.
 */
@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private ProfitMarginService profitMarginService;

    /**
     * Get all active products, optionally filtered by a quick-search term across
     * nome/SKU/linha/marca (web search box, mobile "Entrada de Romaneio" autocomplete).
     * Archived products (see #archiveProduto) are excluded - restore them via
     * their own id first if they need to reappear here.
     * @param search Optional search term
     * @return List of matching products
     */
    @GetMapping
    public List<Produto> getAllProdutos(@RequestParam(required = false) String search) {
        List<Produto> produtos = (search != null && !search.isBlank())
                ? produtoRepository.search(search.trim())
                : produtoRepository.findAll();
        return produtos.stream().filter(Produto::isActive).toList();
    }

    /**
     * Get product by ID.
     * @param id Product ID
     * @return Product entity
     */
    @GetMapping("/{id}")
    public ResponseEntity<Produto> getProdutoById(@PathVariable Long id) {
        return produtoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get product by SKU.
     * @param sku Product SKU
     * @return Product entity
     */
    @GetMapping("/sku/{sku}")
    public ResponseEntity<Produto> getProdutoBySku(@PathVariable String sku) {
        return produtoRepository.findBySku(sku)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new product.
     * @param produto Product data
     * @return Created product
     */
    @PostMapping
    public Produto createProduto(@RequestBody Produto produto) {
        // margem_lucro_percentual is DB-generated (see schema.sql); no need to set it here
        return produtoRepository.save(produto);
    }

    /**
     * Update an existing product.
     * @param id Product ID
     * @param produtoDetails Updated product data
     * @return Updated product
     */
    @PutMapping("/{id}")
    public ResponseEntity<Produto> updateProduto(@PathVariable Long id,
                                                 @RequestBody Produto produtoDetails) {
        return produtoRepository.findById(id)
                .map(produto -> {
                    // Update fields
                    produto.setNome(produtoDetails.getNome());
                    produto.setSku(produtoDetails.getSku());
                    produto.setDescricao(produtoDetails.getDescricao());
                    produto.setPrecoCusto(produtoDetails.getPrecoCusto());
                    produto.setPrecoVenda(produtoDetails.getPrecoVenda());
                    produto.setTipoProduto(produtoDetails.getTipoProduto());
                    produto.setFragrancia(produtoDetails.getFragrancia());
                    produto.setEstoqueMinimo(produtoDetails.getEstoqueMinimo());
                    produto.setEstoqueMaximo(produtoDetails.getEstoqueMaximo());
                    produto.setActive(produtoDetails.isActive());
                    if (produtoDetails.getLinha() != null) {
                        produto.setLinha(produtoDetails.getLinha());
                    }
                    // margem_lucro_percentual is DB-generated (see schema.sql); no need to set it here
                    return ResponseEntity.ok(produtoRepository.save(produto));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a product.
     * @param id Product ID
     * @return Response entity
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduto(@PathVariable Long id) {
        if (!produtoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        produtoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Archives a product (soft delete): keeps the row and its lote/movimentacao
     * history intact, just marks it inactive so it drops out of active-inventory
     * views. Use this instead of DELETE for the normal "remove from catalog" flow.
     * @param id Product ID
     * @return Updated product
     */
    @PutMapping("/{id}/archive")
    public ResponseEntity<Produto> archiveProduto(@PathVariable Long id) {
        return produtoRepository.findById(id)
                .map(produto -> {
                    produto.setActive(false);
                    return ResponseEntity.ok(produtoRepository.save(produto));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Restores a previously archived product back to active inventory.
     * @param id Product ID
     * @return Updated product
     */
    @PutMapping("/{id}/restore")
    public ResponseEntity<Produto> restoreProduto(@PathVariable Long id) {
        return produtoRepository.findById(id)
                .map(produto -> {
                    produto.setActive(true);
                    return ResponseEntity.ok(produtoRepository.save(produto));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get profit margin for a product.
     * @param id Product ID
     * @return Profit margin percentage
     */
    @GetMapping("/{id}/margem-lucro")
    public ResponseEntity<Double> getMargemLucro(@PathVariable Long id) {
        return produtoRepository.findById(id)
                .map(produto -> ResponseEntity.ok(profitMarginService.calcularMargemLucro(produto)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Check if product has healthy profit margin.
     * @param id Product ID
     * @return Boolean indicating if margin is healthy
     */
    @GetMapping("/{id}/margem-saudavel")
    public ResponseEntity<Boolean> isMargemSaudavel(@PathVariable Long id) {
        return produtoRepository.findById(id)
                .map(produto -> ResponseEntity.ok(profitMarginService.isMargemSaudavel(produto)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get profit margin category for a product.
     * @param id Product ID
     * @return Margin category (Baixa, Média, Alta)
     */
    @GetMapping("/{id}/categoria-margem")
    public ResponseEntity<String> getCategoriaMargem(@PathVariable Long id) {
        return produtoRepository.findById(id)
                .map(produto -> ResponseEntity.ok(profitMarginService.getCategoriaMargem(produto)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Filter products by product type.
     * @param tipoProduto Type of product (Perfumaria, Cuidados Diários, etc.)
     * @return List of matching products
     */
    @GetMapping("/filtrar/tipo")
    public List<Produto> filterByTipoProduto(@RequestParam String tipoProduto) {
        return produtoRepository.findByTipoProduto(tipoProduto);
    }

    /**
     * Filter products by fragrance.
     * @param fragrancia Fragrance name
     * @return List of matching products
     */
    @GetMapping("/filtrar/fragrancia")
    public List<Produto> filterByFragrancia(@RequestParam String fragrancia) {
        return produtoRepository.findByFragrancia(fragrancia);
    }

    /**
     * Filter products by line name.
     * @param linhaNome Line name
     * @return List of matching products
     */
    @GetMapping("/filtrar/linha")
    public List<Produto> filterByLinhaNome(@RequestParam String linhaNome) {
        return produtoRepository.findByLinhaNome(linhaNome);
    }

    /**
     * Filter products by brand name.
     * @param marcaNome Brand name
     * @return List of matching products
     */
    @GetMapping("/filtrar/marca")
    public List<Produto> filterByMarcaNome(@RequestParam String marcaNome) {
        return produtoRepository.findByLinhaMarcaNome(marcaNome);
    }

    /**
     * Filter products by product type and line.
     * @param tipoProduto Type of product
     * @param linhaNome Line name
     * @return List of matching products
     */
    @GetMapping("/filtrar/tipo-e-linha")
    public List<Produto> filterByTipoProdutoAndLinhaNome(
            @RequestParam String tipoProduto,
            @RequestParam String linhaNome) {
        return produtoRepository.findByTipoProdutoAndLinhaNome(tipoProduto, linhaNome);
    }

    /**
     * Filter products by product type and fragrance.
     * @param tipoProduto Type of product
     * @param fragrancia Fragrance name
     * @return List of matching products
     */
    @GetMapping("/filtrar/tipo-e-fragrancia")
    public List<Produto> filterByTipoProdutoAndFragrancia(
            @RequestParam String tipoProduto,
            @RequestParam String fragrancia) {
        return produtoRepository.findByTipoProdutoAndFragrancia(tipoProduto, fragrancia);
    }

    /**
     * Filter products by line and fragrance.
     * @param linhaNome Line name
     * @param fragrancia Fragrance name
     * @return List of matching products
     */
    @GetMapping("/filtrar/linha-e-fragrancia")
    public List<Produto> filterByLinhaNomeAndFragrancia(
            @RequestParam String linhaNome,
            @RequestParam String fragrancia) {
        return produtoRepository.findByLinhaNomeAndFragrancia(linhaNome, fragrancia);
    }

    /**
     * Filter products by product type, line, and fragrance.
     * @param tipoProduto Type of product
     * @param linhaNome Line name
     * @param fragrancia Fragrance name
     * @return List of matching products
     */
    @GetMapping("/filtrar/tipo-linha-fragrancia")
    public List<Produto> filterByTipoProdutoLinhaNomeAndFragrancia(
            @RequestParam String tipoProduto,
            @RequestParam String linhaNome,
            @RequestParam String fragrancia) {
        return produtoRepository.findByTipoProdutoAndLinhaNomeAndFragrancia(
                tipoProduto, linhaNome, fragrancia);
    }

    /**
     * Filter products by brand and product type.
     * @param marcaNome Brand name
     * @param tipoProduto Type of product
     * @return List of matching products
     */
    @GetMapping("/filtrar/marca-e-tipo")
    public List<Produto> filterByMarcaNomeAndTipoProduto(
            @RequestParam String marcaNome,
            @RequestParam String tipoProduto) {
        return produtoRepository.findByLinhaMarcaNomeAndTipoProduto(marcaNome, tipoProduto);
    }

    /**
     * Filter products by brand and line.
     * @param marcaNome Brand name
     * @param linhaNome Line name
     * @return List of matching products
     */
    @GetMapping("/filtrar/marca-e-linha")
    public List<Produto> filterByMarcaNomeAndLinhaNome(
            @RequestParam String marcaNome,
            @RequestParam String linhaNome) {
        return produtoRepository.findByLinhaMarcaNomeAndLinhaNome(marcaNome, linhaNome);
    }

    /**
     * Filter products by product type (partial match, case insensitive).
     * @param tipoProduto Type of product to search for
     * @return List of matching products
     */
    @GetMapping("/filtrar/tipo-contem")
    public List<Produto> filterByTipoProdutoContainingIgnoreCase(@RequestParam String tipoProduto) {
        return produtoRepository.findByTipoProdutoContainingIgnoreCase(tipoProduto);
    }

    /**
     * Filter products by fragrance (partial match, case insensitive).
     * @param fragrancia Fragrance to search for
     * @return List of matching products
     */
    @GetMapping("/filtrar/fragrancia-contem")
    public List<Produto> filterByFragranciaContainingIgnoreCase(@RequestParam String fragrancia) {
        return produtoRepository.findByFragranciaContainingIgnoreCase(fragrancia);
    }

    /**
     * Filter products by line name (partial match, case insensitive).
     * @param linhaNome Line name to search for
     * @return List of matching products
     */
    @GetMapping("/filtrar/linha-contem")
    public List<Produto> filterByLinhaNomeContainingIgnoreCase(@RequestParam String linhaNome) {
        return produtoRepository.findByLinhaNomeContainingIgnoreCase(linhaNome);
    }

    /**
     * Filter products by brand name (partial match, case insensitive).
     * @param marcaNome Brand name to search for
     * @return List of matching products
     */
    @GetMapping("/filtrar/marca-contem")
    public List<Produto> filterByLinhaMarcaNomeContainingIgnoreCase(@RequestParam String marcaNome) {
        return produtoRepository.findByLinhaMarcaNomeContainingIgnoreCase(marcaNome);
    }

    /**
     * Filter products by product type and line (partial match, case insensitive).
     * @param tipoProduto Type of product to search for
     * @param linhaNome Line name to search for
     * @return List of matching products
     */
    @GetMapping("/filtrar/tipo-e-linha-contem")
    public List<Produto> filterByTipoProdutoContainingIgnoreCaseAndLinhaNomeContainingIgnoreCase(
            @RequestParam String tipoProduto,
            @RequestParam String linhaNome) {
        return produtoRepository.findByTipoProdutoContainingIgnoreCaseAndLinhaNomeContainingIgnoreCase(
                tipoProduto, linhaNome);
    }

    /**
     * Filter products by product type and fragrance (partial match, case insensitive).
     * @param tipoProduto Type of product to search for
     * @param fragrancia Fragrance to search for
     * @return List of matching products
     */
    @GetMapping("/filtrar/tipo-e-fragrancia-contem")
    public List<Produto> filterByTipoProdutoContainingIgnoreCaseAndFragranciaContainingIgnoreCase(
            @RequestParam String tipoProduto,
            @RequestParam String fragrancia) {
        return produtoRepository.findByTipoProdutoContainingIgnoreCaseAndFragranciaContainingIgnoreCase(
                tipoProduto, fragrancia);
    }

    /**
     * Filter products by line and fragrance (partial match, case insensitive).
     * @param linhaNome Line name to search for
     * @param fragrancia Fragrance to search for
     * @return List of matching products
     */
    @GetMapping("/filtrar/linha-e-fragrancia-contem")
    public List<Produto> filterByLinhaNomeContainingIgnoreCaseAndFragranciaContainingIgnoreCase(
            @RequestParam String linhaNome,
            @RequestParam String fragrancia) {
        return produtoRepository.findByLinhaNomeContainingIgnoreCaseAndFragranciaContainingIgnoreCase(
                linhaNome, fragrancia);
    }
}