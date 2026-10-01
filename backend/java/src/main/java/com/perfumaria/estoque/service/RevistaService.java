package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.Marca;
import com.perfumaria.estoque.model.Revista;
import com.perfumaria.estoque.model.RevistaPagina;
import com.perfumaria.estoque.repository.RevistaPaginaRepository;
import com.perfumaria.estoque.repository.RevistaRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;

/**
 * Turns an uploaded magazine PDF into one JPEG per page, so no client needs a PDF viewer.
 * Not @Transactional on purpose: rendering a big PDF takes a while and the database kills
 * transactions that sit idle, so each page is saved on its own and a failure undoes the lot.
 */
@Service
public class RevistaService {

    static final int PAGE_WIDTH = 1000;
    static final int MAX_HEIGHT = 3000;
    static final int THUMB_WIDTH = 360;
    static final int MAX_PAGES = 200;
    private static final float JPEG_QUALITY = 0.8f;

    @Autowired
    private RevistaRepository revistaRepository;

    @Autowired
    private RevistaPaginaRepository paginaRepository;

    /** @throws IllegalArgumentException when the file is not a usable PDF (message is safe to show) */
    public Revista importar(Marca marca, String titulo, File pdf) {
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            int total = doc.getNumberOfPages();
            if (total < 1) throw new IllegalArgumentException("O PDF não tem páginas");
            if (total > MAX_PAGES) throw new IllegalArgumentException("O PDF tem mais de " + MAX_PAGES + " páginas");

            Revista revista = revistaRepository.save(new Revista(marca, titulo, total));
            try {
                PDFRenderer renderer = new PDFRenderer(doc);
                for (int i = 0; i < total; i++) {
                    float scale = scale(doc.getPage(i), PAGE_WIDTH);
                    paginaRepository.save(new RevistaPagina(revista, i + 1, jpeg(renderer.renderImage(i, scale, ImageType.RGB))));
                    if (i == 0) {
                        float thumbScale = scale(doc.getPage(i), THUMB_WIDTH);
                        paginaRepository.save(new RevistaPagina(revista, RevistaPagina.CAPA, jpeg(renderer.renderImage(i, thumbScale, ImageType.RGB))));
                    }
                }
            } catch (RuntimeException | IOException e) {
                apagar(revista.getId());
                throw e;
            }
            return revista;
        } catch (IOException e) {
            throw new IllegalArgumentException("Não foi possível ler o PDF", e);
        }
    }

    public void apagar(Long revistaId) {
        paginaRepository.deleteByRevistaId(revistaId);
        revistaRepository.deleteById(revistaId);
    }

    /** Scale that makes the page {@code width} px wide, never taller than MAX_HEIGHT (rotation aware). */
    static float scale(PDPage page, int width) {
        PDRectangle box = page.getCropBox();
        boolean sideways = page.getRotation() % 180 != 0;
        float w = sideways ? box.getHeight() : box.getWidth();
        float h = sideways ? box.getWidth() : box.getHeight();
        if (w <= 0 || h <= 0) throw new IllegalArgumentException("PDF com página de tamanho inválido");
        return Math.min(width / w, MAX_HEIGHT / h);
    }

    static byte[] jpeg(BufferedImage image) throws IOException {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(JPEG_QUALITY);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }
}
