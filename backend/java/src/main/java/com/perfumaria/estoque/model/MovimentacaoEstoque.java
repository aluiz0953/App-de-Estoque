package com.perfumaria.estoque.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Immutable log of every stock entry/withdrawal, kept separately from Lote
 * (which only tracks *current* quantity) so the dashboard can chart movement
 * over time — by product, brand or line — without reconstructing history
 * from Lote's mutable quantidade field.
 */
@Entity
@Table(name = "movimentacoes_estoque", indexes = {
        @Index(name = "idx_mov_data", columnList = "data_movimentacao"),
        @Index(name = "idx_mov_produto", columnList = "produto_id")
})
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMovimentacao tipo;

    @Column(nullable = false)
    private int quantidade;

    @Column(length = 20)
    private String estrategia; // FIFO, FEFO, LIFO, MANUAL - null for ENTRADA

    @Column(name = "data_movimentacao", nullable = false)
    private LocalDateTime dataMovimentacao = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    public MovimentacaoEstoque() {}

    public MovimentacaoEstoque(Produto produto, TipoMovimentacao tipo, int quantidade, String estrategia, Usuario usuario) {
        this.produto = produto;
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.estrategia = estrategia;
        this.usuario = usuario;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Produto getProduto() { return produto; }
    public void setProduto(Produto produto) { this.produto = produto; }

    public TipoMovimentacao getTipo() { return tipo; }
    public void setTipo(TipoMovimentacao tipo) { this.tipo = tipo; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }

    public String getEstrategia() { return estrategia; }
    public void setEstrategia(String estrategia) { this.estrategia = estrategia; }

    public LocalDateTime getDataMovimentacao() { return dataMovimentacao; }
    public void setDataMovimentacao(LocalDateTime dataMovimentacao) { this.dataMovimentacao = dataMovimentacao; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public enum TipoMovimentacao {
        ENTRADA, SAIDA
    }
}
