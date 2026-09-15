package com.perfumaria.estoque.notification.service;

import com.perfumaria.estoque.model.Lote;
import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.model.Lote.StatusLote;
import com.perfumaria.estoque.notification.Notificacao;
import com.perfumaria.estoque.notification.repository.NotificacaoRepository;
import com.perfumaria.estoque.repository.LoteRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service responsible for generating notifications based on inventory conditions.
 * Checks for critical stock levels and expiring batches, creating notifications
 * that will be queued for later processing and email delivery.
 */
@Service
public class NotificacaoService {

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    /**
     * Checks all products for critical stock levels and generates notifications.
     * A product has critical stock when total quantity is below its minimum stock level.
     * This method should be called periodically (e.g., every hour).
     */
    @Transactional
    public void verificarEstoqueCritico() {
        List<Produto> produtos = produtoRepository.findByActiveTrue();

        for (Produto produto : produtos) {
            // Get total active quantity for this product
            Integer quantidadeTotal = loteRepository.getTotalQuantityByProdutoId(produto.getId());

            if (quantidadeTotal == null) {
                quantidadeTotal = 0;
            }

            // Check if stock is critical (below minimum)
            if (quantidadeTotal < produto.getEstoqueMinimo()) {
                // Check if we already have a pending critical stock notification for this product
                boolean existeNotificacaoPendente = notificacaoRepository.existsByProdutoIdAndTipoAndStatus(
                        produto.getId(),
                        Notificacao.TipoNotificacao.ESTOQUE_CRITICO,
                        Notificacao.StatusNotificacao.PENDENTE);

                if (!existeNotificacaoPendente) {
                    Notificacao notificacao = new Notificacao(
                            Notificacao.TipoNotificacao.ESTOQUE_CRITICO,
                            "Estoque Crítico: " + produto.getNome(),
                            "O produto " + produto.getNome() + " (SKU: " + produto.getSku() +
                                    ") está com estoque crítico. Quantidade disponível: " + quantidadeTotal +
                                    ", Estoque mínimo: " + produto.getEstoqueMinimo() + ".",
                            produto.getId(),
                            null, // No specific lot for general stock alert
                            "{\"quantidade_atual\": " + quantidadeTotal + ", \"estoque_minimo\": " + produto.getEstoqueMinimo() + "}"
                    );

                    notificacaoRepository.save(notificacao);
                }
            }
        }
    }

    /**
     * Checks all lots for expiration and generates notifications.
     * Creates notifications for lots expiring within 30 days and for already expired lots.
     * This method should be called periodically (e.g., daily).
     */
    @Transactional
    public void verificarVencimentos() {
        LocalDate hoje = LocalDate.now();
        LocalDate daqui30Dias = hoje.plusDays(30);

        // Check for lots expiring within 30 days (but not yet expired)
        List<Lote> lotesVencendoProximos = loteRepository.findByDataValidadeBetweenAndStatusNot(
                hoje, daqui30Dias, StatusLote.VENCIDO);

        for (Lote lote : lotesVencendoProximos) {
            // Check if we already have a pending expiration notification for this lot
            boolean existeNotificacaoPendente = notificacaoRepository.existsByLoteIdAndTipoAndStatus(
                    lote.getId(),
                    Notificacao.TipoNotificacao.VENCIMENTO_PROXIMO,
                    Notificacao.StatusNotificacao.PENDENTE);

            if (!existeNotificacaoPendente) {
                long diasParaVencer = hoje.until(lote.getDataValidade(), java.time.temporal.ChronoUnit.DAYS);

                Notificacao notificacao = new Notificacao(
                        Notificacao.TipoNotificacao.VENCIMENTO_PROXIMO,
                        "Produto Próximo do Vencimento: " + lote.getProduto().getNome(),
                        "O lote " + lote.getNumeroLote() + " do produto " + lote.getProduto().getNome() +
                                " (SKU: " + lote.getProduto().getSku() + ") vence em " + diasParaVencer + " dias " +
                                "(" + lote.getDataValidade() + "). Quantidade: " + lote.getQuantidade() + " " + lote.getUnidadeMedida() + ".",
                        lote.getProduto().getId(),
                        lote.getId(),
                        "{\"dias_para_vencer\": " + diasParaVencer + ", \"data_validade\": \"" + lote.getDataValidade() + "\", \"quantidade\": " + lote.getQuantidade() + "}"
                );

                notificacaoRepository.save(notificacao);
            }
        }

        // Check for already expired lots
        List<Lote> lotesVencidos = loteRepository.findByDataValidadeLessThanEqualAndStatusNot(
                hoje, StatusLote.VENCIDO);

        for (Lote lote : lotesVencidos) {
            // Check if we already have a pending expired notification for this lot
            boolean existeNotificacaoPendente = notificacaoRepository.existsByLoteIdAndTipoAndStatus(
                    lote.getId(),
                    Notificacao.TipoNotificacao.VENCIDO,
                    Notificacao.StatusNotificacao.PENDENTE);

            if (!existeNotificacaoPendente) {
                long diasVencido = lote.getDataValidade().until(hoje, java.time.temporal.ChronoUnit.DAYS);

                Notificacao notificacao = new Notificacao(
                        Notificacao.TipoNotificacao.VENCIDO,
                        "Produto Vencido: " + lote.getProduto().getNome(),
                        "O lote " + lote.getNumeroLote() + " do produto " + lote.getProduto().getNome() +
                                " (SKU: " + lote.getProduto().getSku() + ") está vencido há " + Math.abs(diasVencido) + " dias " +
                                "(" + lote.getDataValidade() + "). Quantidade: " + lote.getQuantidade() + " " + lote.getUnidadeMedida() + ".",
                        lote.getProduto().getId(),
                        lote.getId(),
                        "{\"dias_vencido\": " + Math.abs(diasVencido) + ", \"data_validade\": \"" + lote.getDataValidade() + "\", \"quantidade\": " + lote.getQuantidade() + "}"
                );

                notificacaoRepository.save(notificacao);
            }
        }
    }

    /**
     * Scheduled task that runs daily to check for inventory issues and generate notifications.
     * This method combines both stock and expiration checks.
     */
    @Scheduled(cron = "0 0 7 * * *") // Runs every day at 7:00 AM
    @Transactional
    public void verificarCondicoesEstoquesDiario() {
        verificarEstoqueCritico();
        verificarVencimentos();
    }

    /**
     * Processes pending notifications - marks them as processed for email sending.
     * This would be called by the email processing service.
     *
     * @return Number of notifications processed
     */
    @Transactional
    public int processarNotificacoesPendentes() {
        List<Notificacao> pendentes = notificacaoRepository.findByStatus(Notificacao.StatusNotificacao.PENDENTE);
        int processadas = 0;

        for (Notificacao notificacao : pendentes) {
            notificacao.setStatus(Notificacao.StatusNotificacao.PROCESSADO);
            notificacao.setDataProcessamento(LocalDateTime.now());
            notificacaoRepository.save(notificacao);
            processadas++;
        }

        return processadas;
    }
}