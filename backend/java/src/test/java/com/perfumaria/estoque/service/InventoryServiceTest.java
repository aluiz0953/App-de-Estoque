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
                null, "Prateleira A1", MovimentacaoEstoque.MotivoMovimentacao.COMPRA_RECEBIDA, usuario);

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
        lote1.setStatus(Lote.StatusLote.ATIVO);

        Lote lote2 = new Lote();
        lote2.setId(2L);
        lote2.setProduto(produto);
        lote2.setNumeroLote("LOTE-002");
        lote2.setQuantidade(10);
        lote2.setDataValidade(LocalDate.now().plusDays(20));
        lote2.setStatus(Lote.StatusLote.ATIVO);

        // Mock the repository to return lots ordered by expiration date (FEFO)
        when(loteRepository.findActiveLotesByProdutoOrderByExpiration(1L))
                .thenReturn(Arrays.asList(lote1, lote2));

        // Act
        boolean resultado = inventoryService.retirarEstoqueFIFO(1L, 12, MovimentacaoEstoque.MotivoMovimentacao.VENDA, usuario);

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
        lote1.setStatus(Lote.StatusLote.ATIVO);

        // Mock the repository to return lots with insufficient quantity
        when(loteRepository.findActiveLotesByProdutoOrderByExpiration(1L))
                .thenReturn(Arrays.asList(lote1));

        // Act
        boolean resultado = inventoryService.retirarEstoqueFIFO(1L, 10, MovimentacaoEstoque.MotivoMovimentacao.VENDA, usuario);

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
        lote1.setStatus(Lote.StatusLote.ATIVO);

        // Mock the repository to return lots with exactly enough quantity
        when(loteRepository.findActiveLotesByProdutoOrderByExpiration(1L))
                .thenReturn(Arrays.asList(lote1));

        // Act
        boolean resultado = inventoryService.retirarEstoqueFIFO(1L, 5, MovimentacaoEstoque.MotivoMovimentacao.VENDA, usuario);

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

    private Lote criarLote(int quantidade, Lote.StatusLote status, LocalDate dataValidade, BigDecimal precoCustoLote) {
        Lote lote = new Lote();
        lote.setProduto(produto);
        lote.setQuantidade(quantidade);
        lote.setStatus(status);
        lote.setDataValidade(dataValidade);
        lote.setPrecoCustoLote(precoCustoLote);
        return lote;
    }

    @Test
    void testVerificarDisponibilidade_MistoDeLotes() {
        // Arrange: one sellable lot, one reserved, one already expired, one
        // active-but-expiring-soon lot.
        Lote disponivel = criarLote(10, Lote.StatusLote.ATIVO, LocalDate.now().plusDays(365), new BigDecimal("50.00"));
        Lote reservado = criarLote(4, Lote.StatusLote.RESERVADO, LocalDate.now().plusDays(365), new BigDecimal("50.00"));
        Lote vencido = criarLote(3, Lote.StatusLote.ATIVO, LocalDate.now().minusDays(1), new BigDecimal("50.00"));
        Lote vencendoEmBreve = criarLote(6, Lote.StatusLote.ATIVO, LocalDate.now().plusDays(10), new BigDecimal("50.00"));

        when(loteRepository.findByProdutoId(1L))
                .thenReturn(Arrays.asList(disponivel, reservado, vencido, vencendoEmBreve));

        // Act
        InventoryService.AvailabilityInfo info = inventoryService.verificarDisponibilidade(1L);

        // Assert
        assertEquals(23, info.getQuantidadeTotal()); // 10+4+3+6
        assertEquals(4, info.getQuantidadeReservada());
        assertEquals(3, info.getQuantidadeVencida());
        assertEquals(6, info.getQuantidadeVencendoProximos30Dias());
        // "Disponível" = ATIVO and not yet expired: disponivel (10) + vencendoEmBreve (6)
        assertEquals(16, info.getQuantidadeDisponivel());
        assertEquals(new BigDecimal("800.00"), info.getValorTotalCusto()); // 16 * 50.00
        assertEquals(new BigDecimal("1600.00"), info.getValorTotalVenda()); // 16 * 100.00 (produto.precoVenda)
    }

    @Test
    void testVerificarDisponibilidade_LoteSemPrecoCustoNaoQuebra() {
        // Arrange: a lot with no recorded cost must not NPE, and just doesn't
        // contribute to the cost total.
        Lote semCusto = criarLote(5, Lote.StatusLote.ATIVO, LocalDate.now().plusDays(30), null);
        when(loteRepository.findByProdutoId(1L)).thenReturn(Arrays.asList(semCusto));

        // Act
        InventoryService.AvailabilityInfo info = inventoryService.verificarDisponibilidade(1L);

        // Assert
        assertEquals(5, info.getQuantidadeDisponivel());
        assertEquals(BigDecimal.ZERO, info.getValorTotalCusto());
        assertEquals(new BigDecimal("500.00"), info.getValorTotalVenda());
    }

    @Test
    void testVerificarDisponibilidade_SemLotes() {
        // Arrange
        when(loteRepository.findByProdutoId(1L)).thenReturn(Arrays.asList());

        // Act
        InventoryService.AvailabilityInfo info = inventoryService.verificarDisponibilidade(1L);

        // Assert
        assertEquals(0, info.getQuantidadeTotal());
        assertEquals(0, info.getQuantidadeDisponivel());
        assertEquals(BigDecimal.ZERO, info.getValorTotalCusto());
        assertEquals(BigDecimal.ZERO, info.getValorTotalVenda());
    }

    @Test
    void testProcessarVencimentos_MarcaLotesVencidosComoTal() {
        // Arrange
        Lote lote1 = criarLote(5, Lote.StatusLote.ATIVO, LocalDate.now().minusDays(1), new BigDecimal("10.00"));
        Lote lote2 = criarLote(2, Lote.StatusLote.RESERVADO, LocalDate.now().minusDays(5), new BigDecimal("10.00"));
        when(loteRepository.findByDataValidadeLessThanEqualAndStatusNot(any(LocalDate.class), eq(Lote.StatusLote.VENCIDO)))
                .thenReturn(Arrays.asList(lote1, lote2));

        // Act
        int processados = inventoryService.processarVencimentos();

        // Assert
        assertEquals(2, processados);
        assertEquals(Lote.StatusLote.VENCIDO, lote1.getStatus());
        assertEquals(Lote.StatusLote.VENCIDO, lote2.getStatus());
        verify(loteRepository, times(2)).save(any(Lote.class));
    }

    @Test
    void testProcessarVencimentos_NenhumLoteVencido() {
        // Arrange
        when(loteRepository.findByDataValidadeLessThanEqualAndStatusNot(any(LocalDate.class), eq(Lote.StatusLote.VENCIDO)))
                .thenReturn(Arrays.asList());

        // Act
        int processados = inventoryService.processarVencimentos();

        // Assert
        assertEquals(0, processados);
        verify(loteRepository, never()).save(any(Lote.class));
    }
}