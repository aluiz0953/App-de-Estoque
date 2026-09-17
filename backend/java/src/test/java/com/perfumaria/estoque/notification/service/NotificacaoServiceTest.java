package com.perfumaria.estoque.notification.service;

import com.perfumaria.estoque.model.Lote;
import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.model.Lote.StatusLote;
import com.perfumaria.estoque.notification.Notificacao;
import com.perfumaria.estoque.notification.repository.NotificacaoRepository;
import com.perfumaria.estoque.repository.LoteRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificacaoService.
 * Tests the generation of notifications for critical stock and expirations.
 */
@SpringBootTest
class NotificacaoServiceTest {

    @InjectMocks
    private NotificacaoService notificacaoService;

    @Mock
    private NotificacaoRepository notificacaoRepository;

    @Mock
    private LoteRepository loteRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    private Produto produtoEstoqueCritico;
    private Produto produtoNormal;
    private Lote loteVencendoProximos;
    private Lote loteVencido;
    private Lote loteValido;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Setup test data - Product with critical stock
        produtoEstoqueCritico = new Produto();
        produtoEstoqueCritico.setId(1L);
        produtoEstoqueCritico.setSku("CRITICO-SKU");
        produtoEstoqueCritico.setNome("Produto Estoque Crítico");
        produtoEstoqueCritico.setEstoqueMinimo(10);
        produtoEstoqueCritico.setEstoqueMaximo(100);

        // Setup test data - Normal product
        produtoNormal = new Produto();
        produtoNormal.setId(2L);
        produtoNormal.setSku("NORMAL-SKU");
        produtoNormal.setNome("Produto Normal");
        produtoNormal.setEstoqueMinimo(5);
        produtoNormal.setEstoqueMaximo(50);

        // Setup test data - Lot expiring soon (within 30 days)
        loteVencendoProximos = new Lote();
        loteVencendoProximos.setId(1L);
        loteVencendoProximos.setProduto(produtoNormal);
        loteVencendoProximos.setNumeroLote("LOTE-EXPIRANDO");
        loteVencendoProximos.setQuantidade(20);
        loteVencendoProximos.setDataValidade(LocalDate.now().plusDays(15)); // 15 days from now
        loteVencendoProximos.setStatus(StatusLote.ATIVO);

        // Setup test data - Expired lot
        loteVencido = new Lote();
        loteVencido.setId(2L);
        loteVencido.setProduto(produtoNormal);
        loteVencido.setNumeroLote("LOTE-VENCIDO");
        loteVencido.setQuantidade(10);
        loteVencido.setDataValidade(LocalDate.now().minusDays(5)); // 5 days ago
        loteVencido.setStatus(StatusLote.ATIVO);

        // Setup test data - Valid lot (far in future)
        loteValido = new Lote();
        loteValido.setId(3L);
        loteValido.setProduto(produtoNormal);
        loteValido.setNumeroLote("LOTE-VALIDO");
        loteValido.setQuantidade(30);
        loteValido.setDataValidade(LocalDate.now().plusDays(365)); // 1 year from now
        loteValido.setStatus(StatusLote.ATIVO);
    }

    @Test
    void testVerificarEstoqueCritico_EstoquesCriticos() {
        // Arrange
        when(produtoRepository.findByActiveTrue()).thenReturn(List.of(produtoEstoqueCritico, produtoNormal));
        when(loteRepository.getTotalQuantityByProdutoId(1L)).thenReturn(5); // Below minimum of 10
        when(loteRepository.getTotalQuantityByProdutoId(2L)).thenReturn(20); // Above minimum of 5
        when(notificacaoRepository.existsByProdutoIdAndTipoAndStatus(
                eq(1L),
                eq(Notificacao.TipoNotificacao.ESTOQUE_CRITICO),
                eq(Notificacao.StatusNotificacao.PENDENTE)))
                .thenReturn(false); // No existing pending notification

        // Act
        notificacaoService.verificarEstoqueCritico();

        // Assert
        verify(notificacaoRepository, times(1)).save(any(Notificacao.class));
        // Verify the notification is of correct type
        verify(notificacaoRepository).save(argThat(notificacao ->
                notificacao.getTipo() == Notificacao.TipoNotificacao.ESTOQUE_CRITICO &&
                notificacao.getProdutoId() == 1L &&
                notificacao.getStatus() == Notificacao.StatusNotificacao.PENDENTE));
    }

    @Test
    void testVerificarEstoqueCritico_NaoCriaNotificacaoDuplicada() {
        // Arrange
        when(produtoRepository.findByActiveTrue()).thenReturn(List.of(produtoEstoqueCritico));
        when(loteRepository.getTotalQuantityByProdutoId(1L)).thenReturn(5); // Below minimum
        when(notificacaoRepository.existsByProdutoIdAndTipoAndStatus(
                eq(1L),
                eq(Notificacao.TipoNotificacao.ESTOQUE_CRITICO),
                eq(Notificacao.StatusNotificacao.PENDENTE)))
                .thenReturn(true); // Already has pending notification

        // Act
        notificacaoService.verificarEstoqueCritico();

        // Assert
        verify(notificacaoRepository, never()).save(any(Notificacao.class)); // Should not create duplicate
    }

    @Test
    void testVerificarVencimentos_LotesVencendoProximos() {
        // Arrange
        List<Lote> lotesVencendo = new ArrayList<>();
        lotesVencendo.add(loteVencendoProximos);
        when(loteRepository.findByDataValidadeBetweenAndStatusNot(
                any(LocalDate.class),
                any(LocalDate.class),
                eq(StatusLote.VENCIDO)))
                .thenReturn(lotesVencendo);
        when(notificacaoRepository.existsByLoteIdAndTipoAndStatus(
                eq(1L),
                eq(Notificacao.TipoNotificacao.VENCIMENTO_PROXIMO),
                eq(Notificacao.StatusNotificacao.PENDENTE)))
                .thenReturn(false); // No existing pending notification

        // Act
        notificacaoService.verificarVencimentos();

        // Assert
        verify(notificacaoRepository, times(1)).save(any(Notificacao.class));
        verify(notificacaoRepository).save(argThat(notificacao ->
                notificacao.getTipo() == Notificacao.TipoNotificacao.VENCIMENTO_PROXIMO &&
                notificacao.getLoteId() == 1L &&
                notificacao.getStatus() == Notificacao.StatusNotificacao.PENDENTE));
    }

    @Test
    void testVerificarVencimentos_LotesVencidos() {
        // Arrange
        List<Lote> lotesVencidos = new ArrayList<>();
        lotesVencidos.add(loteVencido);
        when(loteRepository.findByDataValidadeLessThanEqualAndStatusNot(
                any(LocalDate.class),
                eq(StatusLote.VENCIDO)))
                .thenReturn(lotesVencidos);
        when(notificacaoRepository.existsByLoteIdAndTipoAndStatus(
                eq(2L),
                eq(Notificacao.TipoNotificacao.VENCIDO),
                eq(Notificacao.StatusNotificacao.PENDENTE)))
                .thenReturn(false); // No existing pending notification

        // Act
        notificacaoService.verificarVencimentos();

        // Assert
        verify(notificacaoRepository, times(1)).save(any(Notificacao.class));
        verify(notificacaoRepository).save(argThat(notificacao ->
                notificacao.getTipo() == Notificacao.TipoNotificacao.VENCIDO &&
                notificacao.getLoteId() == 2L &&
                notificacao.getStatus() == Notificacao.StatusNotificacao.PENDENTE));
    }

    @Test
    void testProcessarNotificacoesPendentes() {
        // Arrange
        Notificacao notif1 = new Notificacao();
        notif1.setId(1L);
        notif1.setStatus(Notificacao.StatusNotificacao.PENDENTE);

        Notificacao notif2 = new Notificacao();
        notif2.setId(2L);
        notif2.setStatus(Notificacao.StatusNotificacao.PENDENTE);

        List<Notificacao> pendentes = List.of(notif1, notif2);
        when(notificacaoRepository.findByStatus(Notificacao.StatusNotificacao.PENDENTE))
                .thenReturn(pendentes);

        // Act
        int processadas = notificacaoService.processarNotificacoesPendentes();

        // Assert
        assertEquals(2, processadas);
        verify(notificacaoRepository, times(2)).save(any(Notificacao.class));
        // Verify both notifications were marked as PROCESSADO
        verify(notificacaoRepository).save(argThat(notificacao ->
                notificacao.getId() == 1L &&
                notificacao.getStatus() == Notificacao.StatusNotificacao.PROCESSADO));
        verify(notificacaoRepository).save(argThat(notificacao ->
                notificacao.getId() == 2L &&
                notificacao.getStatus() == Notificacao.StatusNotificacao.PROCESSADO));
    }
}