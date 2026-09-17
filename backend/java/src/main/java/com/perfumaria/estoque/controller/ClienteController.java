package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Cliente;
import com.perfumaria.estoque.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Plain CRUD for Cliente - customers who place Pedidos. No business logic
 * here (unlike ProdutoController's margin endpoints), so no service layer.
 */
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @GetMapping
    public List<Cliente> getAllClientes(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return clienteRepository.findByNomeContainingIgnoreCase(search.trim());
        }
        return clienteRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> getClienteById(@PathVariable Long id) {
        return clienteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Cliente createCliente(@RequestBody Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> updateCliente(@PathVariable Long id, @RequestBody Cliente clienteDetails) {
        return clienteRepository.findById(id)
                .map(cliente -> {
                    cliente.setNome(clienteDetails.getNome());
                    cliente.setEmail(clienteDetails.getEmail());
                    cliente.setTelefone(clienteDetails.getTelefone());
                    cliente.setEndereco(clienteDetails.getEndereco());
                    cliente.setActive(clienteDetails.isActive());
                    return ResponseEntity.ok(clienteRepository.save(cliente));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
