package com.perfumaria.estoque.service;

import com.perfumaria.estoque.model.*;
import com.perfumaria.estoque.model.MovimentacaoEstoque.MotivoMovimentacao;
import com.perfumaria.estoque.model.Pedido.StatusPedido;
import com.perfumaria.estoque.repository.ClienteRepository;
import com.perfumaria.estoque.repository.PedidoRepository;
import com.perfumaria.estoque.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Order lifecycle. Stock is only touched on confirmação (see confirmarPedido) -
 * creating a Pedido is pure record-keeping until then.
 */
@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private InventoryService inventoryService;

    public static class ItemRequest {
        public Long produtoId;
        public int quantidade;
    }

    @Transactional
    public Pedido criarPedido(Long clienteId, List<ItemRequest> itensRequest, String observacoes, Usuario usuario) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado: " + clienteId));

        if (itensRequest == null || itensRequest.isEmpty()) {
            throw new IllegalArgumentException("O pedido precisa de ao menos um item.");
        }

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setCriadoPor(usuario);
        pedido.setObservacoes(observacoes);

        BigDecimal total = BigDecimal.ZERO;
        for (ItemRequest itemReq : itensRequest) {
            if (itemReq.quantidade <= 0) {
                throw new IllegalArgumentException("Quantidade inválida.");
            }
            Produto produto = produtoRepository.findById(itemReq.produtoId)
                    .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado: " + itemReq.produtoId));
            PedidoItem item = new PedidoItem(pedido, produto, itemReq.quantidade, produto.getPrecoVenda());
            pedido.getItens().add(item);
            total = total.add(produto.getPrecoVenda().multiply(BigDecimal.valueOf(itemReq.quantidade)));
        }
        pedido.setValorTotal(total);
        return pedidoRepository.save(pedido);
    }

    /**
     * Atomically withdraws stock for every line (FIFO, motivo=VENDA). If any
     * line has insufficient stock, throws and the @Transactional rolls back
     * every withdrawal already made for this order - a confirmação never
     * partially applies.
     */
    @Transactional
    public Pedido confirmarPedido(Long id, Usuario usuario) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: " + id));
        if (pedido.getStatus() != StatusPedido.PENDENTE) {
            throw new IllegalStateException("Apenas pedidos pendentes podem ser confirmados.");
        }
        for (PedidoItem item : pedido.getItens()) {
            boolean sucesso = inventoryService.retirarEstoqueFIFO(
                    item.getProduto().getId(), item.getQuantidade(), MotivoMovimentacao.VENDA, usuario);
            if (!sucesso) {
                throw new IllegalStateException("Estoque insuficiente para: " + item.getProduto().getNome());
            }
        }
        pedido.setStatus(StatusPedido.CONFIRMADO);
        pedido.setDataAtualizacao(LocalDateTime.now());
        return pedidoRepository.save(pedido);
    }

    /**
     * Only allowed from PENDENTE, where no stock has been touched yet.
     * Cancelling a CONFIRMADO/ENVIADO order is refused - reversing a FIFO
     * withdrawal correctly would mean guessing which lots to restore, so
     * that has to be a manual adjustment via the Estoque screens instead.
     */
    @Transactional
    public Pedido cancelarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: " + id));
        if (pedido.getStatus() != StatusPedido.PENDENTE) {
            throw new IllegalStateException(
                    "Apenas pedidos pendentes podem ser cancelados. Este pedido já movimentou estoque - " +
                    "ajuste manualmente pela tela de Estoque se necessário.");
        }
        pedido.setStatus(StatusPedido.CANCELADO);
        pedido.setDataAtualizacao(LocalDateTime.now());
        return pedidoRepository.save(pedido);
    }

    private static final List<StatusPedido> ORDEM_STATUS = List.of(
            StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, StatusPedido.ENVIADO, StatusPedido.ENTREGUE);

    /**
     * Forward-only label transitions that don't touch stock (ENVIADO,
     * ENTREGUE). PENDENTE->CONFIRMADO must go through confirmarPedido
     * instead (it moves stock); CANCELADO must go through cancelarPedido.
     */
    @Transactional
    public Pedido avancarStatus(Long id, StatusPedido novoStatus) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: " + id));

        if (novoStatus == StatusPedido.CANCELADO) {
            throw new IllegalArgumentException("Use o endpoint de cancelamento para cancelar um pedido.");
        }
        if (novoStatus == StatusPedido.CONFIRMADO) {
            throw new IllegalArgumentException("Use o endpoint de confirmação (movimenta estoque).");
        }

        int atual = ORDEM_STATUS.indexOf(pedido.getStatus());
        int alvo = ORDEM_STATUS.indexOf(novoStatus);
        if (atual < 0 || alvo != atual + 1) {
            throw new IllegalStateException("Transição de status inválida: " + pedido.getStatus() + " -> " + novoStatus);
        }

        pedido.setStatus(novoStatus);
        pedido.setDataAtualizacao(LocalDateTime.now());
        return pedidoRepository.save(pedido);
    }
}
