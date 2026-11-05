import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPedidoById, confirmPedido, cancelPedido, clearPedidoDetail } from '../store/slices/pedidosSlice';
import apiService from '../services/api';
import PageHead from '../components/PageHead';
import { STATUS_LABEL, STATUS_STAMP } from './PedidosPage';
import { money } from '../utils/money';

const NEXT_STATUS = { CONFIRMADO: 'ENVIADO', ENVIADO: 'ENTREGUE' };
const NEXT_LABEL = { ENVIADO: 'Marcar como enviado', ENTREGUE: 'Marcar como entregue' };
const COLUMNS = 'grid-cols-[minmax(0,1fr)_110px_100px] sm:grid-cols-[minmax(0,1fr)_140px_110px]';

const BackLink = () => (
  <Link to="/pedidos" className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink">
    <span className="mdi mdi-arrow-left" aria-hidden="true" /> Pedidos
  </Link>
);

const PedidoDetailPage = () => {
  const { id } = useParams();
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
      <main className="mx-auto max-w-[860px] px-5 py-6 md:px-9 md:py-8">
        <BackLink />
        <p className="text-[13px] text-muted" aria-busy="true">Carregando pedido…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-[860px] px-5 py-6 md:px-9 md:py-8">
        <BackLink />
        <p className="text-[13px] text-danger">Erro ao carregar pedido: {error.message || error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[860px] px-5 py-6 md:px-9 md:py-8">
      <BackLink />
      <PageHead title={`Pedido #${pedido.id}`} meta={pedido.cliente?.nome}>
        <span className={`stamp ${STATUS_STAMP[pedido.status]}`}>{STATUS_LABEL[pedido.status]}</span>
      </PageHead>

      {actionError && (
        <p className="mb-4 rounded-md border border-border px-4 py-2.5 text-[13px] text-danger" role="alert">
          {actionError}
        </p>
      )}

      <h2 className="mb-3 text-[15px] font-semibold">Itens</h2>
      <div className="listing">
        <div className={`listing-head grid ${COLUMNS}`}>
          <span>Produto</span>
          <span className="text-right">Qtd × preço</span>
          <span className="text-right">Subtotal</span>
        </div>
        <div className="listing-body">
          {pedido.itens?.map((item) => (
            <div key={item.id} className={`listing-row ${COLUMNS}`}>
              <div className="min-w-0">
                <p className="truncate font-medium">{item.produto?.nome}</p>
                <p className="font-mono text-[12px] text-muted">{item.produto?.sku}</p>
              </div>
              <span className="text-right font-mono tabular-nums text-muted">
                {item.quantidade} × {money(item.precoUnitario)}
              </span>
              <span className="text-right font-mono font-medium tabular-nums">{money(item.precoUnitario * item.quantidade)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-baseline justify-end gap-3 border-t border-border px-5 py-3 text-[13px]">
          <span className="text-muted">Total</span>
          <span className="font-mono text-[16px] font-semibold tabular-nums">{money(pedido.valorTotal)}</span>
        </div>
      </div>

      {pedido.observacoes && (
        <div className="mt-6">
          <h2 className="mb-1 text-[15px] font-semibold">Observações</h2>
          <p className="max-w-[65ch] text-[13px] text-muted">{pedido.observacoes}</p>
        </div>
      )}

      {/* Confirming and cancelling sit at opposite ends: a stray tap never lands on the wrong one. */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
        {pedido.status === 'PENDENTE' && (
          <>
            <button onClick={handleConfirm} disabled={busy} className="btn btn-primary">
              Confirmar pedido
            </button>
            <button onClick={handleCancel} disabled={busy} className="btn btn-danger ml-auto">
              Cancelar pedido
            </button>
          </>
        )}
        {NEXT_STATUS[pedido.status] && (
          <button onClick={handleAdvance} disabled={busy} className="btn btn-primary">
            {NEXT_LABEL[NEXT_STATUS[pedido.status]]}
          </button>
        )}
      </div>
    </main>
  );
};

export default PedidoDetailPage;
