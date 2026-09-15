package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.*;
import com.perfumaria.estoque.repository.LoteRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import com.perfumaria.estoque.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for InventoryService.
 * Tests the encapsulation of FIFO/FEFO inventory logic.
 */
@SpringBootTest
class InventoryServiceTest {

    @InjectMocks
    private InventoryService inventoryService;

    @Mock
    private LoteRepository loteRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private Produto produto;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Setup test data
        produto = new Produto();
        produto.setId(1L);
        produto.setSku("TEST-SKU");
        produto.setNome("Test Product");
        produto.setPrecoCusto(new BigDecimal("50.00"));
        produto.setPrecoVenda(new BigDecimal("100.00"));

        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setUsername("testuser");
        usuario.setRole(Usuario.Role.OPERATOR);
    }

    @Test
    void testAdicionarEstoque() {
        // Arrange
        String numeroLote = "LOTE-TEST-001";
        int quantidade = 10;
        LocalDate dataValidade = LocalDate.now().plusDays(365);
        double precoCusto = 50.0;

        // Act
        Lote resultado = inventoryService.adicionarEstoque(
                1L, numeroLote, quantidade, dataValidade, precoCusto,
                null, "Prateleira A1", usuario);

        // Assert - Since we mocked the repository, we verify the method was called
        // In a real test with actual repository, we'd assert on the returned lot
        assertNotNull(resultado);
        assertEquals(numeroLote, resultado.getNumeroLote());
        assertEquals(quantidade, resultado.getQuantidade());
    }

    @Test
    void testRetirarEstoqueFIFO_SuficienteEstoque() {
        // Arrange
        Lote lote1 = new Lote();
        lote1.setId(1L);
        lote1.setProduto(produto);
        lote1.setNumeroLote("LOTE-001");
        lote1.setQuantidade(5);
        lote1.setDataValidade(LocalDate.now().plusDays(10));
        lote1.setStatusLote(Lote.StatusLote.ATIVO);

        Lote lote2 = new Lote();
        lote2.setId(2L);
        lote2.setProduto(produto);
        lote2.setNumeroLote("LOTE-002");
        lote2.setQuantidade(10);
        lote2.setDataValidade(LocalDate.now().plusDays(20));
        lote2.setStatusLote(Lote.StatusLote.ATIVO);

        // Mock the repository to return lots ordered by expiration date (FEFO)
        when(loteRepository.findActiveLotesByProdutoOrderByExpiration(1L))
                .thenReturn(Arrays.asList(lote1, lote2));

        // Act
        boolean resultado = inventoryService.retirarEstoqueFIFO(1L, 12, usuario);

        // Assert
        assertTrue(resultado); // Should succeed
        // Verify that the lots were updated (in a real test with actual persistence)
        // Since we're mocking, we verify the interaction
        verify(loteRepository, times(1)).findActiveLotesByProdutoOrderByExpiration(1L);
    }

    @Test
    void testRetirarEstoqueFIFO_EstoqueInsuficiente() {
        // Arrange
        Lote lote1 = new Lote();
        lote1.setId(1L);
        lote1.setProduto(produto);
        lote1.setNumeroLote("LOTE-001");
        lote1.setQuantidade(3);
        lote1.setDataValidade(LocalDate.now().plusDays(10));
        lote1.setStatusLote(Lote.StatusLote.ATIVO);

        // Mock the repository to return lots with insufficient quantity
        when(loteRepository.findActiveLotesByProdutoOrderByExpiration(1L))
                .thenReturn(Arrays.asList(lote1));

        // Act
        boolean resultado = inventoryService.retirarEstoqueFIFO(1L, 10, usuario);

        // Assert
        assertFalse(resultado); // Should fail due to insufficient stock
        verify(loteRepository, times(1)).findActiveLotesByProdutoOrderByExpiration(1L);
    }

    @Test
    void testRetirarEstoqueFIFO_ExactamenteSuficiente() {
        // Arrange
        Lote lote1 = new Lote();
        lote1.setId(1L);
        lote1.setProduto(produto);
        lote1.setNumeroLote("LOTE-001");
        lote1.setQuantidade(5);
        lote1.setDataValidade(LocalDate.now().plusDays(10));
        lote1.setStatusLote(Lote.StatusLote.ATIVO);

        // Mock the repository to return lots with exactly enough quantity
        when(loteRepository.findActiveLotesByProdutoOrderByExpiration(1L))
                .thenReturn(Arrays.asList(lote1));

        // Act
        boolean resultado = inventoryService.retirarEstoqueFIFO(1L, 5, usuario);

        // Assert
        assertTrue(resultado); // Should succeed with exact amount
        verify(loteRepository, times(1)).findActiveLotesByProdutoOrderByExpiration(1L);
    }

    @Test
    void testIsExpired() {
        // Arrange
        Lote loteVencido = new Lote();
        loteVencido.setDataValidade(LocalDate.now().minusDays(10)); // Expired 10 days ago

        Lote loteValido = new Lote();
        loteValido.setDataValidade(LocalDate.now().plusDays(10)); // Valid for 10 more days

        // Act & Assert
        assertTrue(loteVencido.isExpired());
        assertFalse(loteValido.isExpired());
    }

    @Test
    void testIsExpiringSoon() {
        // Arrange
        Lote loteExpirandoEm5Dias = new Lote();
        loteExpirandoEm5Dias.setDataValidade(LocalDate.now().plusDays(5));

        Lote loteVencido = new Lote();
        loteVencido.setDataValidade(LocalDate.now().minusDays(2));

        Lote loteValidoLonge = new Lote();
        loteValidoLonge.setDataValidade(LocalDate.now().plusDays(60));

        // Act & Assert
        assertTrue(loteExpirandoEm5Dias.isExpiringSoon());
        assertFalse(loteVencido.isExpiringSoon()); // Already expired
        assertFalse(loteValidoLonge.isExpiringSoon()); // Expires in 60 days (>30)
    }

    @Test
    void testGetValorTotal() {
        // Arrange
        Lote lote = new Lote();
        lote.setPrecoCustoLote(new BigDecimal("25.00"));
        lote.setQuantidade(10);

        // Act
        BigDecimal valor = lote.getValorTotal();

        // Assert
        assertEquals(new BigDecimal("250.00"), valor);
    }

    @Test
    void testGetValorVendaPotencial() {
        // Arrange
        Lote lote = new Lote();
        Produto produto = new Produto();
        produto.setPrecoVenda(new BigDecimal("100.00"));
        lote.setProduto(produto);
        lote.setQuantidade(5);

        // Act
        BigDecimal valor = lote.getValorVendaPotencial();

        // Assert
        assertEquals(new BigDecimal("500.00"), valor);
    }
}