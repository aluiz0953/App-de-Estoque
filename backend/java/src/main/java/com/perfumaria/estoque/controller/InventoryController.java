package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Lote;
import com.perfumaria.estoque.model.Usuario;
import com.perfumaria.estoque.repository.LoteRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import com.perfumaria.estoque.repository.UsuarioRepository;
import com.perfumaria.estoque.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for inventory management operations.
 * Exposes endpoints for stock entry, withdrawal, and inventory inquiries
 * implementing FIFO/FEFO logic.
 */
@RestController
@RequestMapping("/api/estoque")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Add stock to inventory (entrada de romaneio).
     * This corresponds to the mobile app's "Entrada de Romaneio" feature.
     *
     * @param produtoId Product ID
     * @param numeroLote Lot number (from physical box)
     * @param quantidade Quantity to add
     * @param dataValidade Expiration date
     * @param precoCusto Unit cost
     * @param fornecedorId Supplier ID (optional)
     * @param localizacaoArquivo Physical location (optional)
     * @param usuarioId User ID performing the operation
     * @return Created lot
     */
    @PostMapping("/entrada")
    public ResponseEntity<Lote> adicionarEstoque(
            @RequestParam Long produtoId,
            @RequestParam String numeroLote,
            @RequestParam int quantidade,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataValidade,
            @RequestParam double precoCusto,
            @RequestParam(required = false) Long fornecedorId,
            @RequestParam(required = false) String localizacaoArquivo,
            @RequestParam Long usuarioId) {

        // Fetch related entities
        var produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado: " + produtoId));
        var usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + usuarioId));
        var fornecedor = fornecedorId != null ?
                produtoRepository.findById(fornecedorId).map(p -> {
                    // This would need a FornecedorRepository - simplified for now
                    return null;
                }).orElse(null) : null;

        Lote novoLote = inventoryService.adicionarEstoque(
                produtoId, numeroLote, quantidade, dataValidade, precoCusto,
                fornecedorId, localizacaoArquivo, usuario);

        return ResponseEntity.ok(novoLote);
    }

    /**
     * Remove stock from inventory using FIFO logic.
     * This corresponds to the mobile app's "Saída de Estoque" feature.
     *
     * @param produtoId Product ID
     * @param quantidade Quantity to remove
     * @param usuarioId User ID performing the operation
     * @return Result indicating success/failure
     */
    @PostMapping("/saida/fifo")
    public ResponseEntity<Map<String, Object>> retirarEstoqueFIFO(
            @RequestParam Long produtoId,
            @RequestParam int quantidade,
            @RequestParam Long usuarioId) {

        var usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + usuarioId));

        boolean sucesso = inventoryService.retirarEstoqueFIFO(produtoId, quantidade, usuario);

        Map<String, Object> response = new HashMap<>();
        response.put("sucesso", sucesso);
        response.put("mensagem", sucesso ? "Estoque retirado com sucesso usando FIFO" : "Estoque insuficiente");

        return ResponseEntity.ok(response);
    }

    /**
     * Remove stock from inventory using FEFO logic (First Expired, First Out).
     * Prioritizes products closest to expiration.
     *
     * @param produtoId Product ID
     * @param quantidade Quantity to remove
     * @param usuarioId User ID performing the operation
     * @return Result indicating success/failure
     */
    @PostMapping("/saida/fefo")
    public ResponseEntity<Map<String, Object>> retirarEstoqueFEFO(
            @RequestParam Long produtoId,
            @RequestParam int quantidade,
            @RequestParam Long usuarioId) {

        var usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + usuarioId));

        boolean sucesso = inventoryService.retirarEstoqueFEFO(produtoId, quantidade, usuario);

        Map<String, Object> response = new HashMap<>();
        response.put("sucesso", sucesso);
        response.put("mensagem", sucesso ? "Estoque retirado com sucesso usando FEFO" : "Estoque insuficiente");

        return ResponseEntity.ok(response);
    }

    /**
     * Get inventory availability information for a product.
     * Used for dashboard views.
     *
     * @param produtoId Product ID
     * @return Availability information
     */
    @GetMapping("/disponibilidade/{produtoId}")
    public ResponseEntity<InventoryService.AvailabilityInfo> verificarDisponibilidade(
            @PathVariable Long produtoId) {

        var info = inventoryService.verificarDisponibilidade(produtoId);
        return ResponseEntity.ok(info);
    }

    /**
     * Get lots for a product ordered by expiration date (FEFO order).
     * Useful for viewing which lots will expire first.
     *
     * @param produtoId Product ID
     * @return List of lots ordered by expiration date
     */
    @GetMapping("/lotes/{produtoId}")
    public ResponseEntity<List<Lote>> getLotesPorProduto(
            @PathVariable Long produtoId) {

        var lotes = loteRepository.findActiveLotesByProdutoOrderByExpiration(produtoId);
        return ResponseEntity.ok(lotes);
    }

    /**
     * Process expired lots - moves them to VENCIDO status.
     * This would typically be run by a scheduled job.
     *
     * @return Number of lots processed
     */
    @PostMapping("/processar-vencimentos")
    public ResponseEntity<Integer> processarVencimentos() {
        int processados = inventoryService.processarVencimentos();
        return ResponseEntity.ok(processados);
    }

    /**
     * Get summary statistics for inventory dashboard.
     *
     * @return Map containing dashboard statistics
     */
    @GetMapping("/resumo")
    public ResponseEntity<Map<String, Object>> getResumoEstoque() {
        Map<String, Object> resumo = new HashMap<>();

        // In a real implementation, we would calculate these values
        // For now, we'll put placeholder values
        resumo.put("total_produtos", produtoRepository.count());
        resumo.put("total_lotes_ativos", loteRepository.countByStatus(Lote.StatusLote.ATIVO));
        resumo.put("total_lotes_vencidos", loteRepository.countByStatus(Lote.StatusLote.VENCIDO));
        resumo.put("valor_total_estoque", 0.0); // Would be calculated

        return ResponseEntity.ok(resumo);
    }
}