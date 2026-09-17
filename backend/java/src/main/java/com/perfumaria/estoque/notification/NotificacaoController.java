package com.perfumaria.estoque.notification;

import com.perfumaria.estoque.notification.repository.NotificacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST controller for the notification queue (critical stock / expiring batches).
 * Backs the web dashboard's Notificacoes page.
 */
@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @GetMapping
    public List<Notificacao> getNotificacoes(@RequestParam(required = false) Notificacao.StatusNotificacao status) {
        if (status != null) {
            return notificacaoRepository.findByStatus(status);
        }
        return notificacaoRepository.findAll();
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notificacao> marcarComoLida(@PathVariable Long id) {
        return notificacaoRepository.findById(id)
                .map(notificacao -> {
                    notificacao.setStatus(Notificacao.StatusNotificacao.PROCESSADO);
                    notificacao.setDataProcessamento(LocalDateTime.now());
                    return ResponseEntity.ok(notificacaoRepository.save(notificacao));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarNotificacao(@PathVariable Long id) {
        if (!notificacaoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        notificacaoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
