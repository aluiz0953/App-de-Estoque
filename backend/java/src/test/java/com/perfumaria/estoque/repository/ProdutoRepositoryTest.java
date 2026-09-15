package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.model.Linha;
import com.perfumaria.estoque.model.Marca;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for ProdutoRepository.
 * Tests the repository layer with an in-memory database.
 */
@DataJpaTest
class ProdutoRepositoryTest {

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Marca marca;
    private Linha linha;
    private Produto produto;

    @BeforeEach
    void setUp() {
        // Create test data
        marca = new Marca();
        marca.setNome("Teste Marca");
        marca.setDescricao("Marca de teste");
        entityManager.persist(marca);

        linha = new Linha();
        linha.setMarca(marca);
        linha.setNome("Teste Linha");
        linha.setDescricao("Linha de teste");
        entityManager.persist(linha);

        produto = new Produto();
        produto.setLinha(linha);
        produto.setSku("TEST-SKU-001");
        produto.setNome("Produto de Teste");
        produto.setDescricao("Descrição do produto de teste");
        produto.setPrecoCusto(new BigDecimal("50.00"));
        produto.setPrecoVenda(new BigDecimal("100.00"));
        produto.setEstoqueMinimo(5);
        produto.setEstoqueMaximo(100);
        entityManager.persist(produto);

        entityManager.flush();
    }

    @Test
    void testFindBySku() {
        // Act
        Optional<Produto> encontrado = produtoRepository.findBySku("TEST-SKU-001");

        // Assert
        assertTrue(encontrado.isPresent());
        assertEquals("TEST-SKU-001", encontrado.get().getSku());
        assertEquals("Produto de Teste", encontrado.get().getNome());
        assertEquals(new BigDecimal("50.00"), encontrado.get().getPrecoCusto());
        assertEquals(new BigDecimal("100.00"), encontrado.get().getPrecoVenda());
    }

    @Test
    void testFindBySku_NotFound() {
        // Act
        Optional<Produto> encontrado = produtoRepository.findBySku("NON-EXISTENT");

        // Assert
        assertFalse(encontrado.isPresent());
    }

    @Test
    void testSaveAndFindById() {
        // Arrange
        Produto novoProduto = new Produto();
        novoProduto.setLinha(linha);
        novoProduto.setSku("NEW-SKU-002");
        novoProduto.setNome("Novo Produto");
        novoProduto.setPrecoCusto(new BigDecimal("30.00"));
        novoProduto.setPrecoVenda(new BigDecimal("75.00"));

        // Act
        Produto salvo = produtoRepository.save(novoProduto);
        entityManager.flush();

        // Assert
        assertNotNull(salvo.getId());
        Optional<Produto> encontrado = produtoRepository.findById(salvo.getId());
        assertTrue(encontrado.isPresent());
        assertEquals("NEW-SKU-002", encontrado.get().getSku());
        assertEquals("Novo Produto", encontrado.get().getNome());
        assertEquals(new BigDecimal("30.00"), encontrado.get().getPrecoCusto());
        assertEquals(new BigDecimal("75.00"), encontrado.get().getPrecoVenda());
    }

    @Test
    void testExistsBySku() {
        // Act
        boolean exists = produtoRepository.existsBySku("TEST-SKU-001");

        // Assert
        assertTrue(exists);
    }

    @Test
    void testExistsBySku_False() {
        // Act
        boolean exists = produtoRepository.existsBySku("NON-EXISTENT-SKU");

        // Assert
        assertFalse(exists);
    }

    @Test
    void testCalculateMarginIsCorrect() {
        // Act
        Produto produtoDoBanco = produtoRepository.findBySku("TEST-SKU-001").orElseThrow();

        // Assert - Verify the stored margin is correct
        // Note: The margin is calculated and stored via @Formula or @Column with expression in the entity
        // In our case, we have a stored column that gets updated by the service
        assertEquals(new BigDecimal("50.00"), produtoDoBanco.getMargemLucroPercentual());
        // 100 - 50 = 50 profit, 50/100 = 0.5 = 50% margin
    }
}