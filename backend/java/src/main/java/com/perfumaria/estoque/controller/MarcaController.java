package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Linha;
import com.perfumaria.estoque.model.Marca;
import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.repository.LinhaRepository;
import com.perfumaria.estoque.repository.MarcaRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Marca entity — backs the brand dropdown on the product form.
 */
@RestController
@RequestMapping("/api/marcas")
public class MarcaController {

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private LinhaRepository linhaRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    /**
     * Only active brands - this backs the brand dropdown, and an archived
     * brand (see #deleteMarca) has no "unarchive" UI, so it should never be
     * offered here again.
     */
    @GetMapping
    public List<Marca> getAllMarcas() {
        return marcaRepository.findAll().stream().filter(Marca::isActive).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Marca> getMarcaById(@PathVariable Long id) {
        return marcaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Marca> createMarca(@RequestBody Marca marca) {
        if (marcaRepository.existsByNome(marca.getNome())) {
            return ResponseEntity.status(409).build();
        }
        return ResponseEntity.ok(marcaRepository.save(marca));
    }

    /**
     * Removes a brand and its lines/products. Tries a hard delete first; if any
     * of its products already has movimentação/pedido history (FK-linked, not
     * cascaded from Produto — see Produto#lotes vs. movimentacoes_estoque/pedido_itens),
     * that fails on a DB constraint, so we fall back to archiving the whole
     * brand→linha→produto tree instead of losing that audit trail, mirroring
     * ProdutoController#archiveProduto's soft-delete approach.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMarca(@PathVariable Long id) {
        Marca marca = marcaRepository.findById(id).orElse(null);
        if (marca == null) {
            return ResponseEntity.notFound().build();
        }
        try {
            marcaRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("status", "deleted"));
        } catch (DataIntegrityViolationException e) {
            for (Linha linha : linhaRepository.findByMarcaId(id)) {
                for (Produto produto : produtoRepository.findByLinhaId(linha.getId())) {
                    produto.setActive(false);
                    produtoRepository.save(produto);
                }
                linha.setActive(false);
                linhaRepository.save(linha);
            }
            marca.setActive(false);
            marcaRepository.save(marca);
            return ResponseEntity.ok(Map.of("status", "archived"));
        }
    }

    /**
     * Manually re-checks and fixes active=false on every linha/produto under
     * a brand. Exists because the archive fallback above runs its cleanup in
     * the same Hibernate session as the failed cascade-delete it's recovering
     * from, and that session can leave a few rows stuck without an UPDATE
     * actually being flushed. Safe to call repeatedly - it only ever flips
     * active from true to false, on rows scoped to this brand.
     */
    @PutMapping("/{id}/resync-archive")
    public ResponseEntity<?> resyncArchive(@PathVariable Long id) {
        Marca marca = marcaRepository.findById(id).orElse(null);
        if (marca == null) {
            return ResponseEntity.notFound().build();
        }
        int fixedLinhas = 0;
        int fixedProdutos = 0;
        for (Linha linha : linhaRepository.findByMarcaId(id)) {
            for (Produto produto : produtoRepository.findByLinhaId(linha.getId())) {
                if (produto.isActive()) {
                    produto.setActive(false);
                    produtoRepository.save(produto);
                    fixedProdutos++;
                }
            }
            if (linha.isActive()) {
                linha.setActive(false);
                linhaRepository.save(linha);
                fixedLinhas++;
            }
        }
        return ResponseEntity.ok(Map.of("fixedLinhas", fixedLinhas, "fixedProdutos", fixedProdutos));
    }
}
