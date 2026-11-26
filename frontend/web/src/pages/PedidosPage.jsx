import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPedidos } from '../store/slices/pedidosSlice';
import PageHead from '../components/PageHead';
import { money } from '../utils/money';

// Order status as a stamp: the word carries the state, the ink only reinforces it.
export const STATUS_STAMP = {
  PENDENTE: 'stamp-warn',
  CONFIRMADO: 'stamp-ok',
  ENVIADO: 'stamp-ok',
  ENTREGUE: 'stamp-ok',
  CANCELADO: 'stamp-off',
};

export const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const STATUS_FILTERS = ['Todos', 'PENDENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGUE', 'CANCELADO'];
const COLUMNS = 'lg:grid-cols-[minmax(0,1.4fr)_110px_120px_130px_24px]';

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
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <PageHead title="Pedidos" meta={isLoading ? 'Carregando pedidos…' : `${pedidosMeta.totalElements} ${pedidosMeta.totalElements === 1 ? 'pedido' : 'pedidos'}`}>
        <Link to="/pedidos/novo" className="btn btn-primary">
          <span className="mdi mdi-plus text-[16px]" aria-hidden="true" /> Novo pedido
        </Link>
      </PageHead>

      <div className="mb-3 flex flex-wrap gap-x-5 border-b border-border" role="tablist" aria-label="Status do pedido">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={statusFilter === option}
            onClick={() => setStatusFilter(option)}
            className={`tab-link ${statusFilter === option ? 'tab-link-active' : ''}`}
          >
            {option === 'Todos' ? 'Todos' : STATUS_LABEL[option]}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-[13px] text-danger">Erro ao carregar pedidos: {error.message || String(error)}</p>}

      {isLoading ? (
        <div className="listing" aria-busy="true">
          <div className="listing-body">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="listing-row h-[52px]">
                <span className="h-3 w-1/3 animate-pulse rounded bg-black/10" />
              </div>
            ))}
          </div>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="sheet px-5 py-12">
          <p className="text-[14px] font-medium">{statusFilter === 'Todos' ? 'Nenhum pedido registrado.' : 'Nenhum pedido com esse status.'}</p>
          <p className="mt-1 max-w-[60ch] text-[13px] text-muted">
            Um pedido só mexe no estoque quando é confirmado; até lá ele fica pendente e pode ser cancelado sem efeito.
          </p>
          <Link to="/pedidos/novo" className="btn btn-quiet mt-4">
            Novo pedido
          </Link>
        </div>
      ) : (
        <>
          <div className="listing">
            <div className={`listing-head hidden ${COLUMNS} lg:grid`}>
              <span>Cliente</span>
              <span>Data</span>
              <span className="text-right">Total</span>
              <span>Status</span>
              <span />
            </div>
            <div className="listing-body">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/pedidos/${pedido.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/pedidos/${pedido.id}`)}
                  className={`listing-row cursor-pointer grid-cols-2 gap-y-1 ${COLUMNS}`}
                >
                  <div className="col-span-2 min-w-0 lg:col-span-1">
                    <span className="block truncate font-medium">{pedido.cliente?.nome}</span>
                    <span className="block text-[12px] text-muted">{pedido.itens?.length || 0} item(ns)</span>
                  </div>
                  <span className="font-mono text-[12px] text-muted">
                    {pedido.dataCriacao ? new Date(pedido.dataCriacao).toLocaleDateString('pt-BR') : ''}
                  </span>
                  <span className="font-mono tabular-nums lg:text-right">{money(pedido.valorTotal)}</span>
                  <span>
                    <span className={`stamp ${STATUS_STAMP[pedido.status]}`}>{STATUS_LABEL[pedido.status]}</span>
                  </span>
                  <span className="mdi mdi-chevron-right hidden text-[18px] text-muted-light lg:block" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
            <span>
              Página {pedidosMeta.number + 1} de {pedidosMeta.totalPages}
            </span>
            <div className="flex gap-2">
              <button disabled={page <= 0} onClick={() => setPage((p) => p - 1)} className="btn btn-quiet">
                Anterior
              </button>
              <button disabled={page + 1 >= pedidosMeta.totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-quiet">
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default PedidosPage;
