package com.perfumaria.estoque.controller;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** The paged JSON the apps read (content/number/totalPages/totalElements) must stay stable. */
class PageResponseTest {

    @Test
    void of_copiesTheFieldsTheClientsRead() {
        // page index 1 of size 2 over 5 elements -> 3 pages
        PageImpl<String> page = new PageImpl<>(List.of("c", "d"), PageRequest.of(1, 2), 5);

        PageResponse<String> response = PageResponse.of(page);

        assertEquals(List.of("c", "d"), response.content());
        assertEquals(1, response.number());
        assertEquals(2, response.size());
        assertEquals(5, response.totalElements());
        assertEquals(3, response.totalPages());
        assertFalse(response.first());
        assertFalse(response.last());
    }

    @Test
    void of_emptyPage() {
        PageResponse<String> response = PageResponse.of(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        assertTrue(response.content().isEmpty());
        assertEquals(0, response.totalElements());
        assertEquals(0, response.totalPages());
        assertTrue(response.first());
        assertTrue(response.last());
    }
}
