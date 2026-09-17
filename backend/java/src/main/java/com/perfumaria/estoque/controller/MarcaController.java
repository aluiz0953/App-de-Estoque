package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Marca;
import com.perfumaria.estoque.repository.MarcaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Marca entity — backs the brand dropdown on the product form.
 */
@RestController
@RequestMapping("/api/marcas")
public class MarcaController {

    @Autowired
    private MarcaRepository marcaRepository;

    @GetMapping
    public List<Marca> getAllMarcas() {
        return marcaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Marca> getMarcaById(@PathVariable Long id) {
        return marcaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Marca> createMarca(@RequestBody Marca marca) {
        if (marcaRepository.existsByNome(marca.getNome())) {
            return ResponseEntity.status(409).build();
        }
        return ResponseEntity.ok(marcaRepository.save(marca));
    }
}
