package com.perfumaria.estoque.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * AuditLog entity for recording access to sensitive operations.
 * Used for corporate compliance and auditing as specified in security requirements.
 * Specifically tracks access to login screens and manual stock adjustments.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_endpoint", columnList = "endpoint"),
        @Index(name = "idx_access_time", columnList = "access_time"),
        @Index(name = "idx_ip_address", columnList = "ip_address")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String endpoint;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(length = 45) // IPv4 max length
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(name = "access_time", nullable = false)
    private LocalDateTime accessTime = LocalDateTime.now();

    // Optional: reference to the user who performed the action
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    // Constructors
    public AuditLog() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public LocalDateTime getAccessTime() { return accessTime; }
    public void setAccessTime(LocalDateTime accessTime) { this.accessTime = accessTime; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}