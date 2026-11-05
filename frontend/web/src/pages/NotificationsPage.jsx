import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { markNotificationAsRead, deleteNotification } from '../store/slices/inventorySlice';
import { useFetchNotifications } from '../hooks/useFetchNotifications';
import PageHead from '../components/PageHead';

const TIPO_LABEL = {
  ESTOQUE_CRITICO: 'Estoque crítico',
  VENCIMENTO_PROXIMO: 'Vencimento próximo',
  VENCIDO: 'Vencido',
};
const TIPO_STAMP = {
  ESTOQUE_CRITICO: 'stamp-low',
  VENCIMENTO_PROXIMO: 'stamp-warn',
  VENCIDO: 'stamp-off',
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all'); // all, pending, processed

  const params = useMemo(() => (filter === 'pending' ? { status: 'PENDENTE' } : {}), [filter]);
  const { data: notifications, isLoading, error, refetch } = useFetchNotifications(params);

  const list = notifications || [];
  const filtered = filter === 'processed' ? list.filter((n) => n.status !== 'PENDENTE') : list;

  const handleMarkAsRead = async (id) => {
    try {
      await dispatch(markNotificationAsRead(id)).unwrap();
      refetch?.();
    } catch (err) {
      console.error('Error marking notification as processed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta notificação?')) return;
    try {
      await dispatch(deleteNotification(id)).unwrap();
      refetch?.();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const tabs = [
    { key: 'all', label: `Todas (${list.length})` },
    { key: 'pending', label: `Pendentes (${list.filter((n) => n.status === 'PENDENTE').length})` },
    { key: 'processed', label: `Processadas (${list.filter((n) => n.status !== 'PENDENTE').length})` },
  ];

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <PageHead title="Notificações" meta="Estoque crítico e lotes vencendo, avisados pelo sistema." />

      <div className="mb-3 flex flex-wrap gap-x-5 border-b border-border" role="tablist" aria-label="Filtro">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`tab-link ${filter === tab.key ? 'tab-link-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-6 text-[13px] text-muted" aria-busy="true">Carregando notificações…</p>
      ) : error ? (
        <p className="py-6 text-[13px] text-danger">Erro ao carregar notificações: {error.message}</p>
      ) : filtered.length === 0 ? (
        <div className="sheet px-5 py-10">
          <p className="text-[14px] font-medium">Nenhuma notificação por aqui.</p>
          <p className="mt-1 max-w-[60ch] text-[13px] text-muted">
            O sistema avisa quando um produto cai abaixo do estoque mínimo ou quando um lote está perto do vencimento.
          </p>
        </div>
      ) : (
        <div className="listing">
          <div className="listing-body">
            {filtered.map((n) => (
              <div key={n.id} className="listing-row grid-cols-[minmax(0,1fr)] items-start gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className={`font-medium ${n.status === 'PENDENTE' ? 'mark inline' : ''}`}>{n.titulo}</p>
                  <p className="mt-1 max-w-[68ch] text-[13px] text-muted">{n.mensagem}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] text-muted">{new Date(n.dataCriacao).toLocaleString('pt-BR')}</span>
                    <span className={`stamp ${n.status === 'PENDENTE' ? 'stamp-warn' : 'stamp-ok'}`}>
                      {n.status === 'PENDENTE' ? 'Pendente' : 'Processada'}
                    </span>
                    <span className={`stamp ${TIPO_STAMP[n.tipo] || 'stamp-off'}`}>{TIPO_LABEL[n.tipo] || n.tipo}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-6">
                  <button onClick={() => handleMarkAsRead(n.id)} disabled={n.status !== 'PENDENTE'} className="btn btn-quiet h-8 text-[12px]">
                    {n.status === 'PENDENTE' ? 'Marcar como processada' : 'Processada'}
                  </button>
                  {/* Excluir is set apart from the everyday action. */}
                  <button onClick={() => handleDelete(n.id)} className="btn btn-danger h-8 text-[12px]">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default NotificationsPage;
