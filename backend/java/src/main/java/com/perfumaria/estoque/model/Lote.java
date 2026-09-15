package com.perfumaria.estoque.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Lote entity representing physical inventory instances.
 * Contains quantity, expiration date, and is linked to a product.
 * Implements FIFO (First-In, First-Out) inventory logic.
 */
@Entity
@Table(name = "lotes", indexes = {
        @Index(name = "idx_data_validade", columnList = "data_validade"),
        @Index(name = "idx_produto_status", columnList = "produto_id, status"),
        @Index(name = "idx_numero_lote", columnList = "numero_lote")
})
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "numero_lote", nullable = false, length = 50)
    private String numeroLote;

    @Column(nullable = false)
    private int quantidade;

    @Column(name = "unidade_medida", length = 20)
    @Enumerated(EnumType.STRING)
    private UnidadeMedida unidadeMedida = UnidadeMedida.UNIDADE;

    @Column(name = "data_fabricacao")
    private LocalDate dataFabricacao;

    @Column(name = "data_validade", nullable = false)
    private LocalDate dataValidade;

    @Column(name = "preco_custo_lote", precision = 10, scale = 2)
    private BigDecimal precoCustoLote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    @Column(name = "localizacao_arquivo", length = 100)
    private String localizacaoArquivo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private StatusLote status = StatusLote.ATIVO;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criado_por", nullable = false)
    private Usuario criadoPor;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atualizado_por")
    private Usuario atualizadoPor;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    // Constructors
    public Lote() {}

    public Lote(Produto produto, String numeroLote, int quantidade, LocalDate dataValidade, Usuario criadoPor) {
        this.produto = produto;
        this.numeroLote = numeroLote;
        this.quantidade = quantidade;
        this.dataValidade = dataValidade;
        this.criadoPor = criadoPor;
        // Set cost price from product if not provided
        this.precoCustoLote = produto.getPrecoCusto();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Produto getProduto() { return produto; }
    public void setProduto(Produto produto) { this.produto = produto; }

    public String getNumeroLote() { return numeroLote; }
    public void setNumeroLote(String numeroLote) { this.numeroLote = numeroLote; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }

    public UnidadeMedida getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(UnidadeMedida unidadeMedida) { this.unidadeMedida = unidadeMedida; }

    public LocalDate getDataFabricacao() { return dataFabricacao; }
    public void setDataFabricacao(LocalDate dataFabricacao) { this.dataFabricacao = dataFabricacao; }

    public LocalDate getDataValidade() { return dataValidade; }
    public void setDataValidade(LocalDate dataValidade) { this.dataValidade = dataValidade; }

    public BigDecimal getPrecoCustoLote() { return precoCustoLote; }
    public void setPrecoCustoLote(BigDecimal precoCustoLote) { this.precoCustoLote = precoCustoLote; }

    public Fornecedor getFornecedor() { return fornecedor; }
    public void setFornecedor(Fornecedor fornecedor) { this.fornecedor = fornecedor; }

    public String getLocalizacaoArquivo() { return localizacaoArquivo; }
    public void setLocalizacaoArquivo(String localizacaoArquivo) { this.localizacaoArquivo = localizacaoArquivo; }

    public StatusLote getStatus() { return status; }
    public void setStatus(StatusLote status) { this.status = status; }

    public Usuario getCriadoPor() { return criadoPor; }
    public void setCriadoPor(Usuario criadoPor) { this.criadoPor = criadoPor; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public Usuario getAtualizadoPor() { return atualizadoPor; }
    public void setAtualizadoPor(Usuario atualizadoPor) { this.atualizadoPor = atualizadoPor; }

    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Lote lote = (Lote) o;
        return Objects.equals(id, lote.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    /**
     * Business method to check if the lot is expired.
     * Encapsulates the expiration logic.
     */
    public boolean isExpired() {
        return dataValidade.isBefore(LocalDate.now());
    }

    /**
     * Business method to check if the lot is expiring soon (within 30 days).
     * Encapsulates the soon-to-expire logic.
     */
    public boolean isExpiringSoon() {
        LocalDate thirtyDaysFromNow = LocalDate.now().plusDays(30);
        return !isExpired() && dataValidade.isBefore(thirtyDaysFromNow);
    }

    /**
     * Business method to calculate the total value of the lot.
     * Encapsulates the value calculation logic.
     */
    public BigDecimal getValorTotal() {
        return precoCustoLote.multiply(new BigDecimal(quantidade));
    }

    /**
     * Business method to calculate potential sales value.
     * Encapsulates the sales value calculation logic.
     */
    public BigDecimal getValorVendaPotencial() {
        return produto.getPrecoVenda().multiply(new BigDecimal(quantidade));
    }

    // Enums
    public enum UnidadeMedida {
        UNIDADE, CAIXA, FRASCO, ML, L, G, KG
    }

    public enum StatusLote {
        ATIVO, VENCIDO, RESERVADO, BLOQUEADO
    }
}