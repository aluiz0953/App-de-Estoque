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
     * Get all products.
     * @return List of all products
     */
    @GetMapping
    public List<Produto> getAllProdutos() {
        return produtoRepository.findAll();
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
        // Calculate and set profit margin before saving
        profitMarginService.atualizarMargemLucro(produto);
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
                    // Recalculate margin when prices change
                    profitMarginService.atualizarMargemLucro(produto);
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
        return produtoRepository.findById(id)
                .map(produto -> {
                    produtoRepository.deleteById(id);
                    return ResponseEntity.noContent().build();
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
}