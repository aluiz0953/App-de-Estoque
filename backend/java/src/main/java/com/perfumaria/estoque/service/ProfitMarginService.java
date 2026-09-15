package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.Produto;
import org.springframework.stereotype.Service;

/**
 * Service class that encapsulates profit margin calculation logic.
 * This service centralizes all profit-related business rules and calculations.
 */
@Service
public class ProfitMarginService {

    /**
     * Calculates the profit margin percentage for a product.
     * Formula: ((Preço de Venda - Preço de Custo) / Preço de Venda) * 100
     *
     * @param produto The product to calculate margin for
     * @return Profit margin percentage
     */
    public double calcularMargemLucro(Produto produto) {
        if (produto.getPrecoVenda().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return 0.0;
        }

        java.math.BigDecimal lucro = produto.getPrecoVenda().subtract(produto.getPrecoCusto());
        java.math.BigDecimal margem = lucro.divide(produto.getPrecoVenda(), 4, java.math.BigDecimal.ROUND_HALF_UP)
                .multiply(new java.math.BigDecimal(100));

        return margem.doubleValue();
    }

    /**
     * Updates the profit margin percentage for a product based on current prices.
     * This method encapsulates the logic for keeping the margin field in sync.
     *
     * @param produto The product to update margin for
     */
    public void atualizarMargemLucro(Produto produto) {
        produto.setMargemLucroPercentual(java.math.BigDecimal.valueOf(calcularMargemLucro(produto)));
    }

    /**
     * Calculates the potential profit for a given quantity of a product.
     *
     * @param produto The product
     * @param quantidade The quantity
     * @return Potential profit value
     */
    public java.math.BigDecimal calcularLucroPotencial(Produto produto, int quantidade) {
        java.math.BigDecimal lucroUnitario = produto.getPrecoVenda().subtract(produto.getPrecoCusto());
        return lucroUnitario.multiply(new java.math.BigDecimal(quantidade));
    }

    /**
     * Determines if a product has a healthy profit margin.
     * Business rule: Healthy margin is considered above 30%.
     *
     * @param produto The product to check
     * @return true if margin is healthy, false otherwise
     */
    public boolean isMargemSaudavel(Produto produto) {
        return calcularMargemLucro(produto) >= 30.0;
    }

    /**
     * Gets the profit margin category based on percentage.
     * Categories: Baixa (<20%), Média (20-40%), Alta (>40%)
     *
     * @param produto The product to categorize
     * @return Margin category as string
     */
    public String getCategoriaMargem(Produto produto) {
        double margem = calcularMargemLucro(produto);
        if (margem < 20.0) {
            return "Baixa";
        } else if (margem <= 40.0) {
            return "Média";
        } else {
            return "Alta";
        }
    }
}