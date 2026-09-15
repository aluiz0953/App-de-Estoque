package com.perfumaria.estoque.notification;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Notificacao entity representing notifications in the queue.
 * Stores alerts for critical stock levels and expiring batches.
 */
@Entity
@Table(name = "notificacoes", indexes = {
        @Index(name = "idx_tipo_status", columnList = "tipo, status"),
        @Index(name = "idx_data_criacao", columnList = "data_criacao")
})
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Type of notification: ESTOQUE_CRITICO, VENCIMENTO_PROXIMO, VENCIDO
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoNotificacao tipo;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(length = 1000)
    private String mensagem;

    /**
     * Related entity IDs for reference
     */
    private Long produtoId;
    private Long loteId;

    /**
     * Additional data stored as JSON or key-value pairs
     */
    @Column(name = "dados_adicionais", length = 2000)
    private String dadosAdicionais;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusNotificacao status = StatusNotificacao.PENDENTE;

    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "data_processamento")
    private LocalDateTime dataProcessamento;

    @Column(name = "data_envio")
    private LocalDateTime dataEnvio;

    // Constructors
    public Notificacao() {}

    public Notificacao(TipoNotificacao tipo, String titulo, String mensagem,
                      Long produtoId, Long loteId, String dadosAdicionais) {
        this.tipo = tipo;
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.produtoId = produtoId;
        this.loteId = loteId;
        this.dadosAdicionais = dadosAdicionais;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TipoNotificacao getTipo() { return tipo; }
    public void setTipo(TipoNotificacao tipo) { this.tipo = tipo; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }

    public Long getProdutoId() { return produtoId; }
    public void setProdutoId(Long produtoId) { this.produtoId = produtoId; }

    public Long getLoteId() { return loteId; }
    public void setLoteId(Long loteId) { this.loteId = loteId; }

    public String getDadosAdicionais() { return dadosAdicionais; }
    public void setDadosAdicionais(String dadosAdicionais) { this.dadosAdicionais = dadosAdicionais; }

    public StatusNotificacao getStatus() { return status; }
    public void setStatus(StatusNotificacao status) { this.status = status; }

    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }

    public LocalDateTime getDataProcessamento() { return dataProcessamento; }
    public void setDataProcessamento(LocalDateTime dataProcessamento) { this.dataProcessamento = dataProcessamento; }

    public LocalDateTime getDataEnvio() { return dataEnvio; }
    public void setDataEnvio(LocalDateTime dataEnvio) { this.dataEnvio = dataEnvio; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Notificacao that = (Notificacao) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // Enums
    public enum TipoNotificacao {
        ESTOQUE_CRITICO,      // Stock below minimum level
        VENCIMENTO_PROXIMO,   // Expiring within 30 days
        VENCIDO               // Already expired
    }

    public enum StatusNotificacao {
        PENDENTE,     // Waiting to be processed
        PROCESSADO,   // Processed but not sent
        ENVIADO,      // Successfully sent
        FALHOU        // Failed to send
    }
}