package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Marca;
import com.perfumaria.estoque.model.Revista;
import com.perfumaria.estoque.model.RevistaPagina;
import com.perfumaria.estoque.repository.MarcaRepository;
import com.perfumaria.estoque.repository.RevistaPaginaRepository;
import com.perfumaria.estoque.repository.RevistaRepository;
import com.perfumaria.estoque.service.RevistaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Magazines (Revistas) per brand: list, cover + page images for the viewers, PDF upload, delete.
 * Reading is open to any signed-in user; writing is ADMIN/MANAGER (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/revistas")
public class RevistaController {

    /** What the list shows - never the entity, whose images stay out of the JSON. */
    public record RevistaResumo(Long id, String titulo, Long marcaId, String marcaNome, int totalPaginas, LocalDateTime createdAt) {
        static RevistaResumo of(Revista r) {
            return new RevistaResumo(r.getId(), r.getTitulo(), r.getMarca().getId(), r.getMarca().getNome(), r.getTotalPaginas(), r.getCreatedAt());
        }
    }

    @Autowired
    private RevistaRepository revistaRepository;

    @Autowired
    private RevistaPaginaRepository paginaRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private RevistaService revistaService;

    @GetMapping
    public List<RevistaResumo> list() {
        return revistaRepository.findAllActive().stream().map(RevistaResumo::of).toList();
    }

    @GetMapping(value = "/{id}/capa", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> capa(@PathVariable Long id) {
        return imagem(id, RevistaPagina.CAPA);
    }

    @GetMapping(value = "/{id}/paginas/{numero}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> pagina(@PathVariable Long id, @PathVariable int numero) {
        return numero < 1 ? ResponseEntity.notFound().build() : imagem(id, numero);
    }

    private ResponseEntity<byte[]> imagem(Long id, int numero) {
        // A page never changes once rendered (a new upload gets a new id), so the client can keep it.
        return paginaRepository.findImagem(id, numero)
                .map(bytes -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePrivate())
                        .body(bytes))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@RequestParam Long marcaId,
                                    @RequestParam String titulo,
                                    @RequestParam("arquivo") MultipartFile arquivo) throws IOException {
        String nome = titulo.trim();
        if (nome.isEmpty() || nome.length() > 150) {
            return erro(HttpStatus.BAD_REQUEST, "Informe o nome da revista (até 150 caracteres)");
        }
        Marca marca = marcaRepository.findById(marcaId).filter(Marca::isActive).orElse(null);
        if (marca == null) return erro(HttpStatus.BAD_REQUEST, "Marca não encontrada");

        File temp = Files.createTempFile("revista-", ".pdf").toFile();
        try {
            arquivo.transferTo(temp);
            return ResponseEntity.status(HttpStatus.CREATED).body(RevistaResumo.of(revistaService.importar(marca, nome, temp)));
        } catch (IllegalArgumentException e) {
            return erro(HttpStatus.BAD_REQUEST, e.getMessage());
        } finally {
            temp.delete();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!revistaRepository.existsById(id)) return ResponseEntity.notFound().build();
        revistaService.apagar(id);
        return ResponseEntity.noContent().build();
    }

    private static ResponseEntity<Map<String, String>> erro(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
