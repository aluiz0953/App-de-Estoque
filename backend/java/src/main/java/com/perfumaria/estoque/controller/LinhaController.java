package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Linha;
import com.perfumaria.estoque.model.Marca;
import com.perfumaria.estoque.repository.LinhaRepository;
import com.perfumaria.estoque.repository.MarcaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Linha entity — backs the product line dropdown on the
 * product form, which is dependent on the selected brand (marcaId).
 */
@RestController
@RequestMapping("/api/linhas")
public class LinhaController {

    @Autowired
    private LinhaRepository linhaRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @GetMapping
    public List<Linha> getAllLinhas(@RequestParam(required = false) Long marcaId) {
        if (marcaId != null) {
            return linhaRepository.findByMarcaId(marcaId);
        }
        return linhaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Linha> getLinhaById(@PathVariable Long id) {
        return linhaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Linha> createLinha(@RequestBody Linha linha) {
        if (linha.getMarca() == null || linha.getMarca().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        Marca marca = marcaRepository.findById(linha.getMarca().getId()).orElse(null);
        if (marca == null) {
            return ResponseEntity.badRequest().build();
        }
        linha.setMarca(marca);
        return ResponseEntity.ok(linhaRepository.save(linha));
    }
}
