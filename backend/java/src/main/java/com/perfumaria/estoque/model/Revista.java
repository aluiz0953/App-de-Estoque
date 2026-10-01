package com.perfumaria.estoque.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * A brand's magazine. Uploaded as a PDF, kept as one image per page (see RevistaPagina)
 * so the web and mobile apps just show images, page by page.
 */
@Entity
@Table(name = "revistas")
public class Revista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(name = "total_paginas", nullable = false)
    private int totalPaginas;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Revista() {}

    public Revista(Marca marca, String titulo, int totalPaginas) {
        this.marca = marca;
        this.titulo = titulo;
        this.totalPaginas = totalPaginas;
    }

    public Long getId() { return id; }
    public Marca getMarca() { return marca; }
    public String getTitulo() { return titulo; }
    public int getTotalPaginas() { return totalPaginas; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
