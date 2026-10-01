package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.Marca;
import com.perfumaria.estoque.model.Revista;
import com.perfumaria.estoque.model.RevistaPagina;
import com.perfumaria.estoque.repository.RevistaPaginaRepository;
import com.perfumaria.estoque.repository.RevistaRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * RevistaService against real PDFs generated on the fly - no Spring context, no database.
 */
class RevistaServiceTest {

    @InjectMocks
    private RevistaService service;

    @Mock
    private RevistaRepository revistaRepository;

    @Mock
    private RevistaPaginaRepository paginaRepository;

    @TempDir
    Path dir;

    private final Marca marca = new Marca("Natura");

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(revistaRepository.save(any(Revista.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private File pdf(int pages) throws Exception {
        File file = dir.resolve("revista.pdf").toFile();
        try (PDDocument doc = new PDDocument()) {
            for (int i = 0; i < pages; i++) doc.addPage(new PDPage(PDRectangle.A4));
            doc.save(file);
        }
        return file;
    }

    @Test
    void importar_rendersEveryPageAndTheCoverAsJpeg() throws Exception {
        Revista revista = service.importar(marca, "Ciclo 12", pdf(3));

        assertEquals(3, revista.getTotalPaginas());
        ArgumentCaptor<RevistaPagina> saved = ArgumentCaptor.forClass(RevistaPagina.class);
        verify(paginaRepository, times(4)).save(saved.capture());
        List<RevistaPagina> pages = saved.getAllValues();
        // Page 1, then its thumbnail (numero 0), then pages 2 and 3.
        assertEquals(List.of(1, 0, 2, 3), pages.stream().map(RevistaPagina::getNumero).toList());
        for (RevistaPagina p : pages) {
            byte[] img = p.getImagem();
            assertEquals((byte) 0xFF, img[0]);
            assertEquals((byte) 0xD8, img[1]); // JPEG magic
        }
    }

    @Test
    void importar_rejectsAFileThatIsNotAPdf() throws Exception {
        File notPdf = Files.writeString(dir.resolve("x.pdf"), "isto nao e um pdf").toFile();

        assertThrows(IllegalArgumentException.class, () -> service.importar(marca, "X", notPdf));
        verify(revistaRepository, never()).save(any());
    }

    @Test
    void importar_rejectsTooManyPages() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> service.importar(marca, "X", pdf(RevistaService.MAX_PAGES + 1)));
        verify(revistaRepository, never()).save(any());
    }

    @Test
    void scale_swapsWidthAndHeightForSidewaysPages() {
        PDPage upright = new PDPage(PDRectangle.A4);
        PDPage sideways = new PDPage(PDRectangle.A4);
        sideways.setRotation(90);

        assertEquals(RevistaService.PAGE_WIDTH / PDRectangle.A4.getWidth(), RevistaService.scale(upright, RevistaService.PAGE_WIDTH), 0.001);
        assertEquals(RevistaService.PAGE_WIDTH / PDRectangle.A4.getHeight(), RevistaService.scale(sideways, RevistaService.PAGE_WIDTH), 0.001);
    }
}
