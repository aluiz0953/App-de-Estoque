package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.model.Linha;
import com.perfumaria.estoque.model.Marca;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ProfitMarginService.
 * Tests the encapsulation of profit margin calculation logic.
 */
@SpringBootTest
class ProfitMarginServiceTest {

    @InjectMocks
    private ProfitMarginService profitMarginService;

    @Mock
    private Produto produto;

    @Mock
    private Linha linha;

    @Mock
    private Marca marca;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCalcularMargemLucro_LucroPositivo() {
        // Arrange
        produto = new Produto();
        produto.setPrecoCusto(new BigDecimal("50.00"));
        produto.setPrecoVenda(new BigDecimal("100.00"));

        // Act
        double margem = profitMarginService.calcularMargemLucro(produto);

        // Assert
        assertEquals(50.0, margem, 0.01); // 50% margin
    }

    @Test
    void testCalcularMargemLucro_SemLucro() {
        // Arrange
        produto = new Produto();
        produto.setPrecoCusto(new BigDecimal("100.00"));
        produto.setPrecoVenda(new BigDecimal("100.00"));

        // Act
        double margem = profitMarginService.calcularMargemLucro(produto);

        // Assert
        assertEquals(0.0, margem, 0.01); // 0% margin
    }

    @Test
    void testCalcularMargemLucro_Prejuizo() {
        // Arrange
        produto = new Produto();
        produto.setPrecoCusto(new BigDecimal("120.00"));
        produto.setPrecoVenda(new BigDecimal("100.00"));

        // Act
        double margem = profitMarginService.calcularMargemLucro(produto);

        // Assert
        assertEquals(-20.0, margem, 0.01); // -20% margin (loss)
    }

    @Test
    void testCalcularMargemLucro_PrecoVendaZero() {
        // Arrange
        produto = new Produto();
        produto.setPrecoCusto(new BigDecimal("50.00"));
        produto.setPrecoVenda(BigDecimal.ZERO);

        // Act
        double margem = profitMarginService.calcularMargemLucro(produto);

        // Assert
        assertEquals(0.0, margem, 0.01); // Should return 0 to avoid division by zero
    }

    @Test
    void testAtualizarMargemLucro() {
        // Arrange
        produto = new Produto();
        produto.setPrecoCusto(new BigDecimal("40.00"));
        produto.setPrecoVenda(new BigDecimal("100.00"));

        // Act
        profitMarginService.atualizarMargemLucro(produto);

        // Assert
        assertEquals(new BigDecimal("60.00"), produto.getMargemLucroPercentual());
    }

    @Test
    void testCalcularLucroPotencial() {
        // Arrange
        produto = new Produto();
        produto.setPrecoCusto(new BigDecimal("20.00"));
        produto.setPrecoVenda(new BigDecimal("50.00"));
        int quantidade = 10;

        // Act
        BigDecimal lucro = profitMarginService.calcularLucroPotencial(produto, quantidade);

        // Assert
        assertEquals(new BigDecimal("300.00"), lucro); // (50-20) * 10 = 300
    }

    @Test
    void testIsMargemSaudavel_MargemAlta() {
        // Arrange
        produto = new Produto();
        produto.setPrecoCusto(new BigDecimal("30.00"));
        produto.setPrecoVenda(new BigDecimal("100.00")); // 70% margin

        // Act
        boolean saudavel = profitMarginService.isMargemSaudavel(produto);

        // Assert
        assertTrue(saudavel); // Should be true (>30%)
    }

    @Test
    void testIsMargemSaudavel_MargemBaixa() {
        // Arrange
        produto = new Produto();
        produto.setPrecoCusto(new BigDecimal("80.00"));
        produto.setPrecoVenda(new BigDecimal("100.00")); // 20% margin

        // Act
        boolean saudavel = profitMarginService.isMargemSaudavel(produto);

        // Assert
        assertFalse(saudavel); // Should be false (<30%)
    }

    @Test
    void testGetCategoriaMargem() {
        // Arrange
        produto = new Produto();

        // Test Low margin (<20%)
        produto.setPrecoCusto(new BigDecimal("85.00"));
        produto.setPrecoVenda(new BigDecimal("100.00")); // 15% margin
        assertEquals("Baixa", profitMarginService.getCategoriaMargem(produto));

        // Test Medium margin (20-40%)
        produto.setPrecoCusto(new BigDecimal("70.00"));
        produto.setPrecoVenda(new BigDecimal("100.00")); // 30% margin
        assertEquals("Média", profitMarginService.getCategoriaMargem(produto));

        // Test High margin (>40%)
        produto.setPrecoCusto(new BigDecimal("50.00"));
        produto.setPrecoVenda(new BigDecimal("100.00")); // 50% margin
        assertEquals("Alta", profitMarginService.getCategoriaMargem(produto));
    }
}