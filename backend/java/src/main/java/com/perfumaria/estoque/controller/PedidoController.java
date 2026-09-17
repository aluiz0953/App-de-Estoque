package com.perfumaria.estoque.controller;

import com.perfumaria.estoque.model.Pedido;
import com.perfumaria.estoque.model.Pedido.StatusPedido;
import com.perfumaria.estoque.model.Usuario;
import com.perfumaria.estoque.repository.PedidoRepository;
import com.perfumaria.estoque.repository.UsuarioRepository;
import com.perfumaria.estoque.service.PedidoService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PedidoService pedidoService;

    /** Never trust a client-supplied user id - resolve the acting user from the session. */
    private Usuario getUsuarioAutenticado() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado: " + username));
    }

    @GetMapping
    public Page<Pedido> getPedidos(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) StatusPedido status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Specification<Pedido> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (clienteId != null) {
                predicates.add(cb.equal(root.get("cliente").get("id"), clienteId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "dataCriacao"));
        return pedidoRepository.findAll(spec, pageRequest);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> getPedidoById(@PathVariable Long id) {
        return pedidoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    public static class CreatePedidoRequest {
        public Long clienteId;
        public List<PedidoService.ItemRequest> itens;
        public String observacoes;
    }

    @PostMapping
    public ResponseEntity<?> createPedido(@RequestBody CreatePedidoRequest request) {
        try {
            Pedido pedido = pedidoService.criarPedido(
                    request.clienteId, request.itens, request.observacoes, getUsuarioAutenticado());
            return ResponseEntity.status(HttpStatus.CREATED).body(pedido);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/confirmar")
    public ResponseEntity<?> confirmarPedido(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pedidoService.confirmarPedido(id, getUsuarioAutenticado()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarPedido(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pedidoService.cancelarPedido(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    public static class StatusRequest {
        public StatusPedido status;
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        try {
            return ResponseEntity.ok(pedidoService.avancarStatus(id, request.status));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
