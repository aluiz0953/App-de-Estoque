import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPedidos } from '../store/slices/pedidosSlice';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const STATUS_BADGE = {
  PENDENTE: 'bg-[#f0d6c5] text-[#94634d]',
  CONFIRMADO: 'bg-[#dce6d8] text-[#5f7658]',
  ENVIADO: 'bg-[#d8e3ec] text-[#4d6d94]',
  ENTREGUE: 'bg-[#dce6d8] text-[#5f7658]',
  CANCELADO: 'bg-[#ded7d4] text-[#716562]',
};

const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const STATUS_FILTERS = ['Todos', 'PENDENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGUE', 'CANCELADO'];

const PedidosPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pedidos, pedidosMeta, isLoading, error } = useSelector((state) => state.pedidos);

  const [statusFilter, setStatusFilter] = useState('Todos');
  const [page, setPage] = useState(0);

  useEffect(() => setPage(0), [statusFilter]);

  useEffect(() => {
    const params = { page, size: 20 };
    if (statusFilter !== 'Todos') params.status = statusFilter;
    dispatch(fetchPedidos(params));
  }, [dispatch, statusFilter, page]);

  return (
    <main className="p-5 md:p-9">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Pedidos / 01</p>
          <h2 className="font-display mt-3 text-[34px] tracking-[-0.03em] md:text-[40px]">Pedidos de clientes.</h2>
        </div>
        <Link
          to="/pedidos/novo"
          className="pressable flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark"
        >
          <span className="mdi mdi-plus text-[15px]" /> Novo pedido
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option}
            onClick={() => setStatusFilter(option)}
            className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
              statusFilter === option ? 'bg-primary text-primary-50' : 'bg-surface text-muted border border-border hover:bg-brand-bg'
            }`}
          >
            {option === 'Todos' ? 'Todos' : STATUS_LABEL[option]}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-[13px] text-danger">Erro ao carregar pedidos: {error.message || String(error)}</p>}

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_35px_rgba(63,47,35,0.04)]">
        <div className="border-b border-border p-5">
          <h3 className="font-display text-[24px]">Pedidos ({pedidosMeta.totalElements})</h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
            <p className="mt-4 text-[12px] text-muted-light">Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mdi mdi-clipboard-text-outline mx-auto mb-3 block text-[20px] text-secondary" />
            <p className="font-display text-[22px]">Nenhum pedido por aqui.</p>
            <p className="mt-1 text-[12px] text-muted-light">Crie um novo pedido para começar.</p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.2fr_0.8fr_0.7fr_0.9fr_0.6fr] gap-4 border-b border-border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-light lg:grid">
              <span>Cliente</span>
              <span>Data</span>
              <span className="text-right">Total</span>
              <span className="text-center">Status</span>
              <span />
            </div>
            <div>
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  onClick={() => navigate(`/pedidos/${pedido.id}`)}
                  className="grid cursor-pointer grid-cols-2 gap-3 border-b border-[#eee7df] px-5 py-4 last:border-0 hover:bg-brand-bg/60 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.9fr_0.6fr] lg:items-center lg:gap-4"
                >
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-[13px] font-medium">{pedido.cliente?.nome}</p>
                    <p className="mt-0.5 text-[10px] text-muted-light">{pedido.itens?.length || 0} item(ns)</p>
                  </div>
                  <span className="text-[12px] text-muted">
                    {pedido.dataCriacao ? new Date(pedido.dataCriacao).toLocaleDateString('pt-BR') : ''}
                  </span>
                  <span className="text-[12px] font-medium tabular-nums lg:text-right">{money(pedido.valorTotal)}</span>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-center font-mono text-[9px] uppercase tracking-[0.08em] lg:mx-auto ${STATUS_BADGE[pedido.status]}`}
                  >
                    {STATUS_LABEL[pedido.status]}
                  </span>
                  <div className="col-span-2 flex lg:col-span-1 lg:justify-end">
                    <span className="mdi mdi-chevron-right text-[16px] text-muted-light" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-4 text-[11px] text-muted-light">
              <span>
                Página {pedidosMeta.number + 1} de {pedidosMeta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-full border border-border px-3 py-1.5 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={page + 1 >= pedidosMeta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-border px-3 py-1.5 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default PedidosPage;
