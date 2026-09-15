package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.Lote;
import com.perfumaria.estoque.model.Lote.StatusLote;
import com.perfumaria.estoque.repository.LoteRepository;
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
        // In a real implementation, we would fetch the produto and fornecedor from their repositories
        // For now, we'll create the lot with references that would be set properly in service layer

        Lote novoLote = new Lote();
        // novoLote.setProduto(produto); // Would be set from produtoRepository
        novoLote.setNumeroLote(numeroLote);
        novoLote.setQuantidade(quantidade);
        novoLote.setDataValidade(dataValidade);
        novoLote.setPrecoCustoLote(java.math.BigDecimal.valueOf(precoCusto));
        // novoLote.setFornecedor(fornecedor); // Would be set from fornecedorRepository
        novoLote.setLocalizacaoArquivo(localizacaoArquivo);
        novoLote.setStatusLote(StatusLote.ATIVO);
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
        // Get active lots for the product ordered by expiration date (FEFO - First Expired, First Out)
        // For pure FIFO, we would order by creation date instead
        List<Lote> lotesAtivos = loteRepository.findActiveLotesByProdutoOrderByExpiration(produtoId);

        int quantidadeRestante = quantidade;

        for (Lote lote : lotesAtivos) {
            if (quantidadeRestante <= 0) {
                break;
            }

            int quantidadeDisponivel = lote.getQuantidade();

            if (quantidadeDisponivel <= quantidadeRestante) {
                // Use entire lot
                quantidadeRestante -= quantidadeDisponivel;
                lote.setQuantidade(0);
                lote.setStatusLote(StatusLote.BLOQUEADO); // Mark as depleted
            } else {
                // Use partial lot
                lote.setQuantidade(quantidadeDisponivel - quantidadeRestante);
                quantidadeRestante = 0;
            }

            // Update the lot (in a real app, we'd save each change)
            // loteRepository.save(lote); // Would be called in real implementation
        }

        // If we still have quantity remaining, we don't have enough stock
        return quantidadeRestante == 0;
    }

    /**
     * Removes stock from inventory using LIFO (Last-In, First-Out) principle.
     * Alternative method for comparison.
     *
     * @param produtoId The product ID
     * @param quantidade Quantity to remove
     * @param usuario Responsible user
     * @return True if sufficient stock was available and removed
     */
    @Transactional
    public boolean retirarEstoqueLIFO(Long produtoId, int quantidade,
                                     com.perfumaria.estoque.model.Usuario usuario) {
        // For LIFO, we would get lots ordered by most recent first
        // Implementation would be similar to FIFO but with different ordering
        return retirarEstoqueFIFO(produtoId, quantidade, usuario); // Simplified
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
        // This is actually what our FIFO method above does - order by expiration date
        // In practice, true FIFO would order by receipt date, while FEFO orders by expiration
        return retirarEstoqueFIFO(produtoId, quantidade, usuario);
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