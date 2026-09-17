package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.Fornecedor;
import com.perfumaria.estoque.model.Lote;
import com.perfumaria.estoque.model.Lote.StatusLote;
import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.repository.FornecedorRepository;
import com.perfumaria.estoque.repository.LoteRepository;
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

        return loteRepository.save(novoLote);
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
    public boolean retirarEstoqueFIFO(Long produtoId, int quantidade,
                                     com.perfumaria.estoque.model.Usuario usuario) {
        // True FIFO: oldest receipt date (criadoEm) first
        List<Lote> lotesAtivos = loteRepository.findActiveLotesByProdutoOrderByReceiptAsc(produtoId);
        return consumirLotes(lotesAtivos, quantidade);
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
    public boolean retirarEstoqueLIFO(Long produtoId, int quantidade,
                                     com.perfumaria.estoque.model.Usuario usuario) {
        List<Lote> lotesAtivos = loteRepository.findActiveLotesByProdutoOrderByReceiptDesc(produtoId);
        return consumirLotes(lotesAtivos, quantidade);
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
    public boolean retirarEstoqueFEFO(Long produtoId, int quantidade,
                                     com.perfumaria.estoque.model.Usuario usuario) {
        List<Lote> lotesAtivos = loteRepository.findActiveLotesByProdutoOrderByExpiration(produtoId);
        return consumirLotes(lotesAtivos, quantidade);
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
    public com.perfumaria.estoque.service.InventoryService.AvailabilityInfo verificarDisponibilidade(Long produtoId) {
        // In a real implementation, we would query the database
        // This is a simplified version showing the concept
        return new AvailabilityInfo();
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
        // In a real implementation:
        // List<Lote> lotesVencidos = loteRepository.findByDataValidadeLessThanEqualAndStatus(hoje, StatusLote.ATIVO);
        // for (Lote lote : lotesVencidos) {
        //     lote.setStatusLote(StatusLote.VENCIDO);
        //     loteRepository.save(lote);
        // }
        // return lotesVencidos.size();
        return 0; // Placeholder
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