package com.perfumaria.estoque.model;

import jakarta.persistence.*;

/**
 * One rendered page (JPEG) of a Revista. numero 1..totalPaginas are the pages;
 * numero 0 is the small cover thumbnail shown on the magazine list.
 */
@Entity
@Table(name = "revista_paginas", uniqueConstraints = @UniqueConstraint(columnNames = {"revista_id", "numero"}))
public class RevistaPagina {

    public static final int CAPA = 0;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "revista_id", nullable = false)
    private Revista revista;

    @Column(nullable = false)
    private int numero;

    // No @Lob: on PostgreSQL that maps to a large-object oid; a plain byte[] is bytea there and a blob on MySQL.
    @Column(nullable = false, length = 10_000_000)
    private byte[] imagem;

    public RevistaPagina() {}

    public RevistaPagina(Revista revista, int numero, byte[] imagem) {
        this.revista = revista;
        this.numero = numero;
        this.imagem = imagem;
    }

    public Long getId() { return id; }
    public int getNumero() { return numero; }
    public byte[] getImagem() { return imagem; }
}
