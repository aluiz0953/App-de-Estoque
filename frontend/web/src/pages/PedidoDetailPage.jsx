import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPedidoById, confirmPedido, cancelPedido, clearPedidoDetail } from '../store/slices/pedidosSlice';
import apiService from '../services/api';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const NEXT_STATUS = { CONFIRMADO: 'ENVIADO', ENVIADO: 'ENTREGUE' };
const NEXT_LABEL = { ENVIADO: 'Marcar como enviado', ENTREGUE: 'Marcar como entregue' };

const PedidoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pedidoDetail: pedido, isLoading, error } = useSelector((state) => state.pedidos);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchPedidoById(id));
    return () => dispatch(clearPedidoDetail());
  }, [dispatch, id]);

  const handleConfirm = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await dispatch(confirmPedido(id)).unwrap();
    } catch (err) {
      setActionError(err?.message || err);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await dispatch(cancelPedido(id)).unwrap();
    } catch (err) {
      setActionError(err?.message || err);
    } finally {
      setBusy(false);
    }
  };

  const handleAdvance = async () => {
    const proximo = NEXT_STATUS[pedido.status];
    if (!proximo) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiService.updatePedidoStatus(id, proximo);
      dispatch(fetchPedidoById(id));
    } catch (err) {
      setActionError(err?.body?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !pedido) {
    return (
      <main className="p-5 md:p-9">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
          <p className="mt-4 text-[12px] text-muted-light">Carregando pedido...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-5 md:p-9">
        <p className="text-danger">Erro ao carregar pedido: {error.message || error}</p>
      </main>
    );
  }

  return (
    <main className="p-5 md:p-9">
      <button onClick={() => navigate('/pedidos')} className="eyebrow mb-3 flex items-center gap-1 hover:text-secondary-dark">
        <span className="mdi mdi-arrow-left" /> Voltar
      </button>
      <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="font-display text-[34px] tracking-[-0.03em] md:text-[40px]">Pedido #{pedido.id}</h2>
          <p className="mt-2 text-[13px] text-muted">{pedido.cliente?.nome}</p>
        </div>
        <span className="w-fit rounded-full bg-brand-bg px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          {STATUS_LABEL[pedido.status]}
        </span>
      </div>

      {actionError && <p className="mb-4 rounded-lg bg-[#f0d6c5] px-4 py-2 text-[12px] text-[#94634d]">{actionError}</p>}

      <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <p className="eyebrow mb-3">Itens</p>
        <div className="overflow-hidden rounded-lg border border-border">
          {pedido.itens?.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-[12px] last:border-0">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.produto?.nome}</p>
                <p className="text-[10px] text-muted-light">{item.produto?.sku}</p>
              </div>
              <span className="tabular-nums text-muted">{item.quantidade} × {money(item.precoUnitario)}</span>
              <span className="w-20 text-right tabular-nums font-medium">{money(item.precoUnitario * item.quantidade)}</span>
            </div>
          ))}
          <div className="flex justify-end bg-brand-bg px-4 py-3 text-[13px] font-medium">
            Total: <span className="ml-2 tabular-nums">{money(pedido.valorTotal)}</span>
          </div>
        </div>

        {pedido.observacoes && (
          <div className="mt-4">
            <p className="eyebrow mb-1">Observações</p>
            <p className="text-[13px] text-muted">{pedido.observacoes}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          {pedido.status === 'PENDENTE' && (
            <>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="pressable rounded-full bg-primary px-5 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark disabled:opacity-50"
              >
                Confirmar pedido
              </button>
              <button
                onClick={handleCancel}
                disabled={busy}
                className="rounded-full border border-border px-5 py-2.5 text-[12px] text-danger hover:bg-brand-bg disabled:opacity-50"
              >
                Cancelar pedido
              </button>
            </>
          )}
          {NEXT_STATUS[pedido.status] && (
            <button
              onClick={handleAdvance}
              disabled={busy}
              className="pressable rounded-full bg-primary px-5 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark disabled:opacity-50"
            >
              {NEXT_LABEL[NEXT_STATUS[pedido.status]]}
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default PedidoDetailPage;
