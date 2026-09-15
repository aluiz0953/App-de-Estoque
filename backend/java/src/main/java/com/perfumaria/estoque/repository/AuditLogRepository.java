package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.AuditLog;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Repository for AuditLog entity.
 * Provides CRUD operations for audit logging.
 */
@RepositoryRestResource(exported = false) // Don't expose audit logs via REST for security
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Find by endpoint
    java.util.List<AuditLog> findByEndpoint(String endpoint);

    // Find by IP address
    java.util.List<AuditLog> findByIpAddress(String ipAddress);

    // Find by date range
    java.util.List<AuditLog> findByAccessTimeBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    // Find by user
    java.util.List<AuditLog> findByUsuarioId(Long usuarioId);

    // Count by endpoint
    long countByEndpoint(String endpoint);
}