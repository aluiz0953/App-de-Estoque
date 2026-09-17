import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { markNotificationAsRead, deleteNotification } from '../store/slices/inventorySlice';
import { useFetchNotifications } from '../hooks/useFetchNotifications';

const TIPO_LABEL = {
  ESTOQUE_CRITICO: 'Estoque crítico',
  VENCIMENTO_PROXIMO: 'Vencimento próximo',
  VENCIDO: 'Vencido',
};
const TIPO_BADGE = {
  ESTOQUE_CRITICO: 'bg-[#ded7d4] text-[#716562]',
  VENCIMENTO_PROXIMO: 'bg-[#f0d6c5] text-[#94634d]',
  VENCIDO: 'bg-[#e5b5b2] text-[#7a3c3a]',
};

const NotificationsPage = () => {
  const navigate = useNavigate();
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

  return (
    <main className="p-5 md:p-9">
      <button onClick={() => navigate(-1)} className="eyebrow mb-3 flex items-center gap-1 hover:text-secondary-dark">
        <span className="mdi mdi-arrow-left" /> Voltar
      </button>
      <h2 className="font-display mb-8 text-[34px] tracking-[-0.03em] md:text-[40px]">Notificações.</h2>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'all', label: `Todas (${list.length})` },
          { key: 'pending', label: `Pendentes (${list.filter((n) => n.status === 'PENDENTE').length})` },
          { key: 'processed', label: `Processadas (${list.filter((n) => n.status !== 'PENDENTE').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
              filter === tab.key ? 'bg-primary text-primary-50' : 'bg-surface text-muted border border-border hover:bg-brand-bg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
          <p className="mt-4 text-[12px] text-muted-light">Carregando notificações...</p>
        </div>
      ) : error ? (
        <p className="py-12 text-center text-danger">Erro ao carregar notificações: {error.message}</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-light">Nenhuma notificação encontrada</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border border-border bg-surface p-5 ${n.status === 'PENDENTE' ? 'border-l-4 border-l-secondary-dark' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mdi mdi-bell-outline grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-[18px] text-primary-50" />
                  <div>
                    <h3 className="text-[13px] font-medium">{n.titulo}</h3>
                    <p className="mt-1 text-[12px] text-muted">{n.mensagem}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-light">
                      <span>{new Date(n.dataCriacao).toLocaleString('pt-BR')}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono uppercase tracking-[0.06em] ${
                          n.status === 'PENDENTE' ? 'bg-[#f0d6c5] text-[#94634d]' : 'bg-[#dce6d8] text-[#5f7658]'
                        }`}
                      >
                        {n.status === 'PENDENTE' ? 'Pendente' : 'Processada'}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-mono uppercase tracking-[0.06em] ${TIPO_BADGE[n.tipo] || 'bg-brand-bg'}`}>
                        {TIPO_LABEL[n.tipo] || n.tipo}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    disabled={n.status !== 'PENDENTE'}
                    className="text-[12px] font-medium text-secondary-dark hover:text-primary disabled:opacity-40"
                  >
                    {n.status === 'PENDENTE' ? 'Marcar como processada' : 'Processada'}
                  </button>
                  <button onClick={() => handleDelete(n.id)} className="text-[12px] font-medium text-danger">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default NotificationsPage;
