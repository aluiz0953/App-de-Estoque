package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.Fornecedor;
import com.perfumaria.estoque.model.Lote;
import com.perfumaria.estoque.model.Lote.StatusLote;
import com.perfumaria.estoque.model.MovimentacaoEstoque;
import com.perfumaria.estoque.model.MovimentacaoEstoque.TipoMovimentacao;
import com.perfumaria.estoque.model.MovimentacaoEstoque.MotivoMovimentacao;
import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.repository.FornecedorRepository;
import com.perfumaria.estoque.repository.LoteRepository;
import com.perfumaria.estoque.repository.MovimentacaoEstoqueRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Service class that encapsulates FIFO (First-In, First-Out) inventory logic.
 * This service centralizes all inventory-related business rules including
 * stock entry, withdrawal, and expiration management using FIFO/FEFO principles.
 */
@Service
public class InventoryService {

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    /**
     * Adds stock to inventory using FIFO principle for cost calculation.
     * Creates a new lot with the specified quantity and cost.
     *
     * @param produtoId The product ID
     * @param numeroLote The lot number
     * @param quantidade Quantity to add
     * @param dataValidade Expiration date
     * @param precoCusto Unit cost
     * @param fornecedorId Supplier ID (optional)
     * @param localizacaoArquivo Physical location (optional)
     * @param usuario Responsible user
     * @return The created lot
     */
    @Transactional
    public Lote adicionarEstoque(Long produtoId, String numeroLote, int quantidade,
                                LocalDate dataValidade, double precoCusto,
                                Long fornecedorId, String localizacaoArquivo,
                                MotivoMovimentacao motivo,
                                com.perfumaria.estoque.model.Usuario usuario) {
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado: " + produtoId));

        Fornecedor fornecedor = fornecedorId != null
                ? fornecedorRepository.findById(fornecedorId)
                        .orElseThrow(() -> new IllegalArgumentException("Fornecedor não encontrado: " + fornecedorId))
                : null;

        Lote novoLote = new Lote();
        novoLote.setProduto(produto);
        novoLote.setNumeroLote(numeroLote);
        novoLote.setQuantidade(quantidade);
        novoLote.setDataValidade(dataValidade);
        novoLote.setPrecoCustoLote(java.math.BigDecimal.valueOf(precoCusto));
        novoLote.setFornecedor(fornecedor);
        novoLote.setLocalizacaoArquivo(localizacaoArquivo);
        novoLote.setStatus(StatusLote.ATIVO);
        novoLote.setCriadoPor(usuario);

        Lote salvo = loteRepository.save(novoLote);
        movimentacaoEstoqueRepository.save(
                new MovimentacaoEstoque(produto, TipoMovimentacao.ENTRADA, quantidade, null, motivo, usuario));
        return salvo;
    }

    /**
     * Removes stock from inventory using FIFO (First-In, First-Out) principle.
     * This method implements the core FIFO logic for inventory withdrawal.
     *
     * @param produtoId The product ID
     * @param quantidade Quantity to remove
     * @param usuario Responsible user
     * @return True if sufficient stock was available and removed
     */
    @Transactional
    public boolean retirarEstoqueFIFO(Long produtoId, int quantidade, MotivoMovimentacao motivo,
                                     com.perfumaria.estoque.model.Usuario usuario) {
        // True FIFO: oldest receipt date (criadoEm) first
        List<Lote> lotesAtivos = loteRepository.findActiveLotesByProdutoOrderByReceiptAsc(produtoId);
        return registrarSaida(produtoId, quantidade, "FIFO", motivo, usuario, consumirLotes(lotesAtivos, quantidade));
    }

    /**
     * Removes stock from inventory using LIFO (Last-In, First-Out) principle.
     * Prioritizes the most recently received lots.
     *
     * @param produtoId The product ID
     * @param quantidade Quantity to remove
     * @param usuario Responsible user
     * @return True if sufficient stock was available and removed
     */
    @Transactional
    public boolean retirarEstoqueLIFO(Long produtoId, int quantidade, MotivoMovimentacao motivo,
                                     com.perfumaria.estoque.model.Usuario usuario) {
        List<Lote> lotesAtivos = loteRepository.findActiveLotesByProdutoOrderByReceiptDesc(produtoId);
        return registrarSaida(produtoId, quantidade, "LIFO", motivo, usuario, consumirLotes(lotesAtivos, quantidade));
    }

    /**
     * Removes stock from inventory using FEFO (First-Expired, First-Out) principle.
     * Prioritizes lots that are closest to expiration.
     *
     * @param produtoId The product ID
     * @param quantidade Quantity to remove
     * @param usuario Responsible user
     * @return True if sufficient stock was available and removed
     */
    @Transactional
    public boolean retirarEstoqueFEFO(Long produtoId, int quantidade, MotivoMovimentacao motivo,
                                     com.perfumaria.estoque.model.Usuario usuario) {
        List<Lote> lotesAtivos = loteRepository.findActiveLotesByProdutoOrderByExpiration(produtoId);
        return registrarSaida(produtoId, quantidade, "FEFO", motivo, usuario, consumirLotes(lotesAtivos, quantidade));
    }

    /**
     * Logs a SAIDA movement only when the withdrawal actually succeeded — a failed
     * withdrawal (insufficient stock) must not appear in the movement history/chart.
     */
    private boolean registrarSaida(Long produtoId, int quantidade, String estrategia, MotivoMovimentacao motivo,
                                    com.perfumaria.estoque.model.Usuario usuario, boolean sucesso) {
        if (sucesso) {
            Produto produto = produtoRepository.findById(produtoId)
                    .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado: " + produtoId));
            movimentacaoEstoqueRepository.save(
                    new MovimentacaoEstoque(produto, TipoMovimentacao.SAIDA, quantidade, estrategia, motivo, usuario));
        }
        return sucesso;
    }

    /**
     * Shared consumption logic: walks the given lots (already sorted by the caller's
     * chosen strategy) and draws down quantity from each until satisfied or exhausted.
     */
    private boolean consumirLotes(List<Lote> lotesOrdenados, int quantidade) {
        int quantidadeRestante = quantidade;

        for (Lote lote : lotesOrdenados) {
            if (quantidadeRestante <= 0) {
                break;
            }

            int quantidadeDisponivel = lote.getQuantidade();

            if (quantidadeDisponivel <= quantidadeRestante) {
                // Use entire lot
                quantidadeRestante -= quantidadeDisponivel;
                lote.setQuantidade(0);
                lote.setStatus(StatusLote.BLOQUEADO); // Mark as depleted
            } else {
                // Use partial lot
                lote.setQuantidade(quantidadeDisponivel - quantidadeRestante);
                quantidadeRestante = 0;
            }

            loteRepository.save(lote);
        }

        // If we still have quantity remaining, we don't have enough stock
        return quantidadeRestante == 0;
    }

    /**
     * Checks product availability and expiration status.
     * Provides information about stock levels and upcoming expirations.
     *
     * @param produtoId The product ID
     * @return Object containing availability information
     */
    public AvailabilityInfo verificarDisponibilidade(Long produtoId) {
        AvailabilityInfo info = new AvailabilityInfo();
        java.math.BigDecimal valorTotalCusto = java.math.BigDecimal.ZERO;
        java.math.BigDecimal valorTotalVenda = java.math.BigDecimal.ZERO;

        for (Lote lote : loteRepository.findByProdutoId(produtoId)) {
            int quantidade = lote.getQuantidade();
            info.setQuantidadeTotal(info.getQuantidadeTotal() + quantidade);

            if (lote.getStatus() == StatusLote.RESERVADO) {
                info.setQuantidadeReservada(info.getQuantidadeReservada() + quantidade);
            }

            if (lote.isExpired()) {
                info.setQuantidadeVencida(info.getQuantidadeVencida() + quantidade);
            } else if (lote.isExpiringSoon()) {
                info.setQuantidadeVencendoProximos30Dias(info.getQuantidadeVencendoProximos30Dias() + quantidade);
            }

            // Only stock that is actually sellable right now (active status, not
            // past its expiration date yet) counts as "disponível" and feeds the
            // potential value totals — reserved/expired/blocked lots don't.
            if (lote.getStatus() == StatusLote.ATIVO && !lote.isExpired()) {
                info.setQuantidadeDisponivel(info.getQuantidadeDisponivel() + quantidade);
                // preco_custo_lote is nullable in schema.sql - a lot without a
                // recorded cost just doesn't contribute to the cost total.
                if (lote.getPrecoCustoLote() != null) {
                    valorTotalCusto = valorTotalCusto.add(lote.getValorTotal());
                }
                valorTotalVenda = valorTotalVenda.add(lote.getValorVendaPotencial());
            }
        }

        info.setValorTotalCusto(valorTotalCusto);
        info.setValorTotalVenda(valorTotalVenda);
        return info;
    }

    /**
     * Processes inventory expiration - moves expired lots to expired status.
     * Should be run periodically (e.g., daily).
     *
     * @return Number of lots that were expired
     */
    @Transactional
    public int processarVencimentos() {
        LocalDate hoje = LocalDate.now();
        // Excludes lots already VENCIDO so re-running this (it's meant to run daily)
        // doesn't keep re-touching the same rows; every other status (ATIVO,
        // RESERVADO, BLOQUEADO) still flips once its expiration date has passed.
        List<Lote> lotesVencidos = loteRepository.findByDataValidadeLessThanEqualAndStatusNot(hoje, StatusLote.VENCIDO);
        for (Lote lote : lotesVencidos) {
            lote.setStatus(StatusLote.VENCIDO);
            loteRepository.save(lote);
        }
        return lotesVencidos.size();
    }

    /**
     * Inner class to hold inventory availability information.
     */
    public static class AvailabilityInfo {
        private int quantidadeTotal;
        private int quantidadeDisponivel;
        private int quantidadeReservada;
        private int quantidadeVencida;
        private int quantidadeVencendoProximos30Dias;
        private java.math.BigDecimal valorTotalCusto;
        private java.math.BigDecimal valorTotalVenda;

        // Getters and setters would go here
        public int getQuantidadeTotal() { return quantidadeTotal; }
        public void setQuantidadeTotal(int quantidadeTotal) { this.quantidadeTotal = quantidadeTotal; }
        public int getQuantidadeDisponivel() { return quantidadeDisponivel; }
        public void setQuantidadeDisponivel(int quantidadeDisponivel) { this.quantidadeDisponivel = quantidadeDisponivel; }
        public int getQuantidadeReservada() { return quantidadeReservada; }
        public void setQuantidadeReservada(int quantidadeReservada) { this.quantidadeReservada = quantidadeReservada; }
        public int getQuantidadeVencida() { return quantidadeVencida; }
        public void setQuantidadeVencida(int quantidadeVencida) { this.quantidadeVencida = quantidadeVencida; }
        public int getQuantidadeVencendoProximos30Dias() { return quantidadeVencendoProximos30Dias; }
        public void setQuantidadeVencendoProximos30Dias(int quantidadeVencendoProximos30Dias) { this.quantidadeVencendoProximos30Dias = quantidadeVencendoProximos30Dias; }
        public java.math.BigDecimal getValorTotalCusto() { return valorTotalCusto; }
        public void setValorTotalCusto(java.math.BigDecimal valorTotalCusto) { this.valorTotalCusto = valorTotalCusto; }
        public java.math.BigDecimal getValorTotalVenda() { return valorTotalVenda; }
        public void setValorTotalVenda(java.math.BigDecimal valorTotalVenda) { this.valorTotalVenda = valorTotalVenda; }
    }
}