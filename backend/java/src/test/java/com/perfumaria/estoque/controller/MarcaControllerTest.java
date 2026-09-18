package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Linha;
import com.perfumaria.estoque.model.Marca;
import com.perfumaria.estoque.model.Produto;
import com.perfumaria.estoque.repository.LinhaRepository;
import com.perfumaria.estoque.repository.MarcaRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MarcaController, covering the hard-delete/archive-fallback
 * behavior on DELETE /api/marcas/{id}, the resync-archive repair endpoint,
 * and the isActive filter on GET /api/marcas (the bug that let archived
 * brands - e.g. leftover seed data - keep showing up in the catalog).
 * Pure Mockito unit test - no Spring context, no database needed.
 */
class MarcaControllerTest {

    @InjectMocks
    private MarcaController marcaController;

    @Mock
    private MarcaRepository marcaRepository;

    @Mock
    private LinhaRepository linhaRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    private Marca marca;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        marca = new Marca();
        marca.setId(1L);
        marca.setNome("Chanel");
        marca.setActive(true);
    }

    @Test
    void getAllMarcas_excludesArchivedBrands() {
        Marca ativa = new Marca();
        ativa.setId(2L);
        ativa.setNome("O Boticário");
        ativa.setActive(true);

        Marca arquivada = new Marca();
        arquivada.setId(1L);
        arquivada.setNome("Chanel");
        arquivada.setActive(false);

        when(marcaRepository.findAll()).thenReturn(List.of(ativa, arquivada));

        List<Marca> result = marcaController.getAllMarcas();

        assertEquals(1, result.size());
        assertEquals("O Boticário", result.get(0).getNome());
    }

    @Test
    void deleteMarca_hardDeletesWhenNoDependentHistory() {
        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marca));
        doNothing().when(marcaRepository).deleteById(1L);

        ResponseEntity<?> response = marcaController.deleteMarca(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(Map.of("status", "deleted"), response.getBody());
        verify(marcaRepository).deleteById(1L);
        verifyNoInteractions(linhaRepository, produtoRepository);
    }

    @Test
    void deleteMarca_returnsNotFoundWhenMarcaDoesNotExist() {
        when(marcaRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = marcaController.deleteMarca(99L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(marcaRepository, never()).deleteById(anyLong());
    }

    @Test
    void deleteMarca_fallsBackToArchivingWholeTreeOnConstraintViolation() {
        Linha linha = new Linha();
        linha.setId(10L);
        linha.setActive(true);

        Produto produto = new Produto();
        produto.setId(100L);
        produto.setActive(true);

        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marca));
        doThrow(new DataIntegrityViolationException("FK constraint"))
                .when(marcaRepository).deleteById(1L);
        when(linhaRepository.findByMarcaId(1L)).thenReturn(List.of(linha));
        when(produtoRepository.findByLinhaId(10L)).thenReturn(List.of(produto));

        ResponseEntity<?> response = marcaController.deleteMarca(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(Map.of("status", "archived"), response.getBody());
        assertFalse(produto.isActive(), "produto under the archived line should be deactivated");
        assertFalse(linha.isActive(), "linha under the archived marca should be deactivated");
        assertFalse(marca.isActive(), "marca itself should be deactivated");
        verify(produtoRepository).save(produto);
        verify(linhaRepository).save(linha);
        verify(marcaRepository).save(marca);
    }

    @Test
    void resyncArchive_flipsActiveFlagsLeftBehindByFailedFlush() {
        marca.setActive(false);
        Linha linha = new Linha();
        linha.setId(10L);
        linha.setActive(true); // stuck true from an earlier partial flush

        Produto produtoAtivo = new Produto();
        produtoAtivo.setId(100L);
        produtoAtivo.setActive(true); // stuck true

        Produto produtoJaArquivado = new Produto();
        produtoJaArquivado.setId(101L);
        produtoJaArquivado.setActive(false); // already correct - must not be re-saved

        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marca));
        when(linhaRepository.findByMarcaId(1L)).thenReturn(List.of(linha));
        when(produtoRepository.findByLinhaId(10L)).thenReturn(List.of(produtoAtivo, produtoJaArquivado));

        ResponseEntity<?> response = marcaController.resyncArchive(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(Map.of("fixedLinhas", 1, "fixedProdutos", 1), response.getBody());
        assertFalse(linha.isActive());
        assertFalse(produtoAtivo.isActive());
        verify(produtoRepository).save(produtoAtivo);
        verify(produtoRepository, never()).save(produtoJaArquivado);
        verify(linhaRepository).save(linha);
    }
}
