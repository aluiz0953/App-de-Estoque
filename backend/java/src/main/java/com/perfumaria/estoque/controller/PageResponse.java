package com.perfumaria.estoque.controller;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * The paged-list JSON the web and mobile apps read: {@code content}, {@code number}, {@code size},
 * {@code totalElements}, {@code totalPages}, {@code first}, {@code last}. A plain record on purpose:
 * returning Spring Data's {@code Page} directly is not a stable JSON contract (Spring Data warns
 * about it and may change the shape), so the shape is pinned here.
 */
public record PageResponse<T>(
        List<T> content,
        int number,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast());
    }
}
