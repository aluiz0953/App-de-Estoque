package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Lote;
import com.perfumaria.estoque.model.MovimentacaoEstoque;
import com.perfumaria.estoque.model.MovimentacaoEstoque.MotivoMovimentacao;
import com.perfumaria.estoque.model.Usuario;
import com.perfumaria.estoque.repository.LoteRepository;
import com.perfumaria.estoque.repository.MovimentacaoEstoqueRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import com.perfumaria.estoque.repository.UsuarioRepository;
import com.perfumaria.estoque.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Autowired
    private MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    /**
     * Resolves the acting Usuario from the authenticated session rather than trusting
     * a client-supplied id — an unauthenticated caller can't reach these endpoints at
     * all (see SecurityConfig), but a client-supplied usuarioId would let any logged-in
     * user attribute a stock change to someone else, which defeats the audit trail.
     */
    private Usuario getUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado: " + authentication.getName()));
    }

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
            @RequestParam MotivoMovimentacao motivo) {

        Lote novoLote = inventoryService.adicionarEstoque(
                produtoId, numeroLote, quantidade, dataValidade, precoCusto,
                fornecedorId, localizacaoArquivo, motivo, getUsuarioAutenticado());

        return ResponseEntity.ok(novoLote);
    }

    /**
     * Remove stock from inventory using FIFO logic.
     * This corresponds to the mobile app's "Saída de Estoque" feature.
     *
     * @param produtoId Product ID
     * @param quantidade Quantity to remove
     * @return Result indicating success/failure
     */
    @PostMapping("/saida/fifo")
    public ResponseEntity<Map<String, Object>> retirarEstoqueFIFO(
            @RequestParam Long produtoId,
            @RequestParam int quantidade,
            @RequestParam MotivoMovimentacao motivo) {

        boolean sucesso = inventoryService.retirarEstoqueFIFO(produtoId, quantidade, motivo, getUsuarioAutenticado());

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
     * @return Result indicating success/failure
     */
    @PostMapping("/saida/fefo")
    public ResponseEntity<Map<String, Object>> retirarEstoqueFEFO(
            @RequestParam Long produtoId,
            @RequestParam int quantidade,
            @RequestParam MotivoMovimentacao motivo) {

        boolean sucesso = inventoryService.retirarEstoqueFEFO(produtoId, quantidade, motivo, getUsuarioAutenticado());

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
        List<Lote> lotesAtivos = loteRepository.findByStatus(Lote.StatusLote.ATIVO);

        java.math.BigDecimal valorTotalEstoque = lotesAtivos.stream()
                .map(Lote::getValorTotal)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal lucroPotencial = lotesAtivos.stream()
                .map(lote -> lote.getValorVendaPotencial().subtract(lote.getValorTotal()))
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("totalProdutos", produtoRepository.count());
        resumo.put("totalLotesAtivos", (long) lotesAtivos.size());
        resumo.put("totalLotesVencidos", loteRepository.countByStatus(Lote.StatusLote.VENCIDO));
        resumo.put("valorTotalEstoque", valorTotalEstoque);
        resumo.put("lucroPotencial", lucroPotencial);

        return ResponseEntity.ok(resumo);
    }

    /**
     * Stock-outflow history for the dashboard chart: which brand/line sold the most
     * over a given window. Returns raw movement rows (with produto->linha->marca
     * populated) so the client can aggregate by whatever bucket it needs.
     *
     * @param dias How many days back to look (default 30)
     */
    @GetMapping("/movimentacoes")
    public ResponseEntity<List<MovimentacaoEstoque>> getMovimentacoes(
            @RequestParam(defaultValue = "30") int dias,
            @RequestParam(defaultValue = "SAIDA") MovimentacaoEstoque.TipoMovimentacao tipo) {

        LocalDateTime fim = LocalDateTime.now();
        LocalDateTime inicio = fim.minusDays(dias);
        return ResponseEntity.ok(movimentacaoEstoqueRepository.findByTipoAndDataMovimentacaoBetween(tipo, inicio, fim));
    }

    /**
     * Movement-history list for the Histórico screen (web + mobile): every filter
     * is optional, so the client can start from "everything" and narrow down by
     * produto, operador (usuário), tipo, motivo and/or an explicit date range —
     * unlike {@link #getMovimentacoes}, which is a fixed rolling window built only
     * for the dashboard chart. Newest first, paginated.
     *
     * @param produtoId Filter to one product (optional)
     * @param usuarioId Filter to one operator/user (optional)
     * @param tipo ENTRADA/SAIDA (optional)
     * @param motivo Reason (optional)
     * @param dataInicio Start of range, inclusive (optional)
     * @param dataFim End of range, inclusive (optional)
     * @param page Zero-based page number (default 0)
     * @param size Page size (default 20, max 100)
     */
    @GetMapping("/movimentacoes/historico")
    public ResponseEntity<Page<MovimentacaoEstoque>> getHistoricoMovimentacoes(
            @RequestParam(required = false) Long produtoId,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) MovimentacaoEstoque.TipoMovimentacao tipo,
            @RequestParam(required = false) MotivoMovimentacao motivo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Specification<MovimentacaoEstoque> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (produtoId != null) {
                predicates.add(cb.equal(root.get("produto").get("id"), produtoId));
            }
            if (usuarioId != null) {
                predicates.add(cb.equal(root.get("usuario").get("id"), usuarioId));
            }
            if (tipo != null) {
                predicates.add(cb.equal(root.get("tipo"), tipo));
            }
            if (motivo != null) {
                predicates.add(cb.equal(root.get("motivo"), motivo));
            }
            if (dataInicio != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dataMovimentacao"), dataInicio.atStartOfDay()));
            }
            if (dataFim != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dataMovimentacao"), dataFim.atTime(23, 59, 59)));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "dataMovimentacao"));
        return ResponseEntity.ok(movimentacaoEstoqueRepository.findAll(spec, pageRequest));
    }
}