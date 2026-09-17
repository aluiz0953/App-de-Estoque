package com.perfumaria.estoque.notification.repository;

import com.perfumaria.estoque.notification.Notificacao;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Repository for Notificacao entity.
 * Provides CRUD operations and custom queries for notification management.
 */
@RepositoryRestResource(exported = false) // fronted by NotificacaoController at /api/notificacoes instead
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    // Find by type and status
    java.util.List<Notificacao> findByTipoAndStatus(Notificacao.TipoNotificacao tipo, Notificacao.StatusNotificacao status);

    // Find pending notifications
    java.util.List<Notificacao> findByStatus(Notificacao.StatusNotificacao status);

    // Find by product ID
    java.util.List<Notificacao> findByProdutoId(Long produtoId);

    // Find by lot ID
    java.util.List<Notificacao> findByLoteId(Long loteId);

    // Find by date range
    java.util.List<Notificacao> findByDataCriacaoBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    // Count pending notifications by type
    long countByTipoAndStatus(Notificacao.TipoNotificacao tipo, Notificacao.StatusNotificacao status);

    // Whether a pending/processed notification already exists for a product (avoids duplicates)
    boolean existsByProdutoIdAndTipoAndStatus(Long produtoId, Notificacao.TipoNotificacao tipo, Notificacao.StatusNotificacao status);

    // Whether a pending/processed notification already exists for a lot (avoids duplicates)
    boolean existsByLoteIdAndTipoAndStatus(Long loteId, Notificacao.TipoNotificacao tipo, Notificacao.StatusNotificacao status);

    // Notifications processed within a time window (used to compile the daily email)
    java.util.List<Notificacao> findByDataProcessamentoBetweenAndStatus(
            java.time.LocalDateTime start, java.time.LocalDateTime end, Notificacao.StatusNotificacao status);
}