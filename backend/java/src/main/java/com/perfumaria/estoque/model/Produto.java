package com.perfumaria.estoque.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.GenerationTime;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Produto entity representing base product data.
 * Contains core product information and calculated fields.
 */
@Entity
@Table(name = "produtos", uniqueConstraints = {
        @UniqueConstraint(columnNames = "sku"),
        @UniqueConstraint(columnNames = "barcode_ean13"),
        @UniqueConstraint(columnNames = "barcode_upc")
})
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "linha_id", nullable = false)
    private Linha linha;

    @Column(nullable = false, length = 50, unique = true)
    private String sku;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(length = 1000)
    private String descricao;

    @Column(name = "barcode_ean13", length = 13, unique = true)
    private String barcodeEan13;

    @Column(name = "barcode_upc", length = 12, unique = true)
    private String barcodeUpc;

    @Column(name = "altura_cm", precision = 5, scale = 2)
    private BigDecimal alturaCm;

    @Column(name = "largura_cm", precision = 5, scale = 2)
    private BigDecimal larguraCm;

    @Column(name = "profundidade_cm", precision = 5, scale = 2)
    private BigDecimal profundidadeCm;

    @Column(name = "peso_gramas", precision = 8, scale = 3)
    private BigDecimal pesoGramas;

    @Column(name = "preco_custo", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoCusto;

    @Column(name = "preco_venda", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoVenda;

    /**
     * Tipo de produto (Perfumaria, Cuidados Diários, Rosto e Proteção, Outros)
     */
    @Column(name = "tipo_produto", length = 50)
    private String tipoProduto;

    /**
     * Fragrância específica do produto
     */
    @Column(name = "fragrancia", length = 100)
    private String fragrancia;

    /**
     * Calculated profit margin percentage. This is a MySQL GENERATED ALWAYS AS
     * column (see schema.sql) — Hibernate must never write to it, only read it back.
     */
    @Generated(GenerationTime.ALWAYS)
    @Column(name = "margem_lucro_percentual", precision = 5, scale = 2, insertable = false, updatable = false)
    private BigDecimal margemLucroPercentual;

    @Column(name = "estoque_minimo", nullable = false)
    private int estoqueMinimo = 0;

    @Column(name = "estoque_maximo", nullable = false)
    private int estoqueMaximo = 999999;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // One-to-many relationship with Lote
    @JsonIgnore // avoids Produto -> lotes -> Produto infinite recursion on serialization
    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Lote> lotes = new HashSet<>();

    // Constructors
    public Produto() {}

    public Produto(Linha linha, String sku, String nome, BigDecimal precoCusto, BigDecimal precoVenda) {
        this.linha = linha;
        this.sku = sku;
        this.nome = nome;
        this.precoCusto = precoCusto;
        this.precoVenda = precoVenda;
        // Calculate margin
        this.margemLucroPercentual = precoVenda.subtract(precoCusto)
                .divide(precoVenda, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal(100));
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Linha getLinha() { return linha; }
    public void setLinha(Linha linha) { this.linha = linha; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getBarcodeEan13() { return barcodeEan13; }
    public void setBarcodeEan13(String barcodeEan13) { this.barcodeEan13 = barcodeEan13; }

    public String getBarcodeUpc() { return barcodeUpc; }
    public void setBarcodeUpc(String barcodeUpc) { this.barcodeUpc = barcodeUpc; }

    public BigDecimal getAlturaCm() { return alturaCm; }
    public void setAlturaCm(BigDecimal alturaCm) { this.alturaCm = alturaCm; }

    public BigDecimal getLarguraCm() { return larguraCm; }
    public void setLarguraCm(BigDecimal larguraCm) { this.larguraCm = larguraCm; }

    public BigDecimal getProfundidadeCm() { return profundidadeCm; }
    public void setProfundidadeCm(BigDecimal profundidadeCm) { this.profundidadeCm = profundidadeCm; }

    public BigDecimal getPesoGramas() { return pesoGramas; }
    public void setPesoGramas(BigDecimal pesoGramas) { this.pesoGramas = pesoGramas; }

    public BigDecimal getPrecoCusto() { return precoCusto; }
    public void setPrecoCusto(BigDecimal precoCusto) { this.precoCusto = precoCusto; }

    public BigDecimal getPrecoVenda() { return precoVenda; }
    public void setPrecoVenda(BigDecimal precoVenda) { this.precoVenda = precoVenda; }

    public String getTipoProduto() { return tipoProduto; }
    public void setTipoProduto(String tipoProduto) { this.tipoProduto = tipoProduto; }

    public String getFragrancia() { return fragrancia; }
    public void setFragrancia(String fragrancia) { this.fragrancia = fragrancia; }

    public BigDecimal getMargemLucroPercentual() { return margemLucroPercentual; }
    public void setMargemLucroPercentual(BigDecimal margemLucroPercentual) { this.margemLucroPercentual = margemLucroPercentual; }

    public int getEstoqueMinimo() { return estoqueMinimo; }
    public void setEstoqueMinimo(int estoqueMinimo) { this.estoqueMinimo = estoqueMinimo; }

    public int getEstoqueMaximo() { return estoqueMaximo; }
    public void setEstoqueMaximo(int estoqueMaximo) { this.estoqueMaximo = estoqueMaximo; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Set<Lote> getLotes() { return lotes; }
    public void setLotes(Set<Lote> lotes) { this.lotes = lotes; }

    /**
     * Total active quantity across all lots — exposed as a computed API field since
     * clients (web dashboard, mobile Estoque Crítico view) need it but it isn't a stored column.
     */
    @Transient
    public int getQuantidadeTotal() {
        return lotes.stream()
                .filter(lote -> lote.getStatus() == Lote.StatusLote.ATIVO)
                .mapToInt(Lote::getQuantidade)
                .sum();
    }

    /**
     * Sale value of the currently active stock (quantidadeTotal * precoVenda).
     */
    @Transient
    public BigDecimal getValorTotalEstoque() {
        return precoVenda.multiply(BigDecimal.valueOf(getQuantidadeTotal()));
    }

    /**
     * Active-lot quantity already past its expiration date — feeds the
     * "visão operacional" (rupturas e vencimentos) dashboard.
     */
    @Transient
    public int getQuantidadeVencida() {
        return lotes.stream()
                .filter(lote -> lote.getStatus() == Lote.StatusLote.ATIVO && lote.isExpired())
                .mapToInt(Lote::getQuantidade)
                .sum();
    }

    /**
     * Active-lot quantity expiring within the next 30 days (not yet expired).
     */
    @Transient
    public int getQuantidadeVencendoProximos30Dias() {
        return lotes.stream()
                .filter(lote -> lote.getStatus() == Lote.StatusLote.ATIVO && lote.isExpiringSoon())
                .mapToInt(Lote::getQuantidade)
                .sum();
    }

    /**
     * Business method to calculate profit margin.
     * Encapsulates the logic for profit calculation.
     */
    public BigDecimal calcularMargemLucro() {
        if (precoVenda.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return precoVenda.subtract(precoCusto)
                .divide(precoVenda, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal(100));
    }

    /**
     * Business method to update profit margin based on current prices.
     */
    public void atualizarMargemLucro() {
        this.margemLucroPercentual = calcularMargemLucro();
    }
}