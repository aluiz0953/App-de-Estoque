import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../store/slices/inventorySlice';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading: isLoadingProducts } = useSelector((state) => state.inventory);
  const { data: resumo, isLoading: isLoadingResumo, error: errorResumo } = useFetchEstoqueResumo();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const estoqueBaixo = useMemo(
    () => products.filter((p) => p.quantidadeTotal <= p.estoqueMinimo).slice(0, 6),
    [products]
  );
  const vencendo = useMemo(
    () => products.filter((p) => p.quantidadeVencendoProximos30Dias > 0).slice(0, 6),
    [products]
  );

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <main className="p-5 md:p-9">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">{today}</p>
          <h2 className="font-display mt-3 text-[34px] tracking-[-0.03em] md:text-[40px]">
            Visão geral do <em className="text-secondary-dark not-italic">estoque.</em>
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-[10px] text-muted">
          <span className={`h-2 w-2 rounded-full ${errorResumo ? 'bg-danger' : 'bg-success'}`} />
          {errorResumo ? 'Falha ao sincronizar' : 'Dados em tempo real'}
        </div>
      </div>

      {errorResumo ? (
        <p className="text-danger">Erro ao carregar resumo do estoque: {errorResumo.message}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Produtos ativos" value={resumo?.totalProdutos ?? 0} loading={isLoadingResumo} tone="dark" icon="package-variant-closed" />
          <StatCard label="Lotes ativos" value={resumo?.totalLotesAtivos ?? 0} loading={isLoadingResumo} icon="checkbox-marked-circle-outline" />
          <StatCard
            label="Valor em estoque"
            value={money(resumo?.valorTotalEstoque)}
            loading={isLoadingResumo}
            tone="rose"
            icon="currency-brl"
          />
          <StatCard label="Lucro potencial" value={money(resumo?.lucroPotencial)} loading={isLoadingResumo} icon="trending-up" />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Estoque crítico" subtitle="Produtos no ou abaixo do mínimo">
          {isLoadingProducts ? (
            <p className="py-8 text-center text-[12px] text-muted-light">Carregando...</p>
          ) : estoqueBaixo.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-light">Nenhum produto com estoque crítico.</p>
          ) : (
            <div className="divide-y divide-[#eee7df]">
              {estoqueBaixo.map((p) => (
                <Link
                  key={p.id}
                  to={`/produtos/${p.id}`}
                  className="flex items-center justify-between gap-3 py-3 text-[13px] hover:text-secondary-dark"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.nome}</p>
                    <p className="text-[10px] text-muted-light tabular-nums">{p.sku}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#ded7d4] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#716562] tabular-nums">
                    {p.quantidadeTotal}/{p.estoqueMinimo}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Vencendo em 30 dias" subtitle="Lotes ativos próximos do vencimento">
          {isLoadingProducts ? (
            <p className="py-8 text-center text-[12px] text-muted-light">Carregando...</p>
          ) : vencendo.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-light">Nenhum lote vencendo em breve.</p>
          ) : (
            <div className="divide-y divide-[#eee7df]">
              {vencendo.map((p) => (
                <Link
                  key={p.id}
                  to={`/produtos/${p.id}`}
                  className="flex items-center justify-between gap-3 py-3 text-[13px] hover:text-secondary-dark"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.nome}</p>
                    <p className="text-[10px] text-muted-light tabular-nums">{p.sku}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f0d6c5] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#94634d] tabular-nums">
                    {p.quantidadeVencendoProximos30Dias} un.
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
};

const StatCard = ({ label, value, detail, icon, tone = 'light', loading }) => {
  const styles =
    tone === 'dark'
      ? 'bg-primary text-primary-50'
      : tone === 'rose'
        ? 'bg-[#ead8d1] text-[#5c4540]'
        : 'bg-surface text-ink border border-border';
  return (
    <div className={`rounded-xl p-5 ${styles}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-65">{label}</span>
        <span className={`mdi mdi-${icon} text-[16px] opacity-65`} />
      </div>
      <p className="font-display mt-5 text-[32px] leading-none tabular-nums md:text-[37px]">{loading ? '···' : value}</p>
      {detail && <p className="mt-2 text-[11px] opacity-60">{detail}</p>}
    </div>
  );
};

const Panel = ({ title, subtitle, children }) => (
  <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_35px_rgba(63,47,35,0.04)]">
    <div className="border-b border-border p-5">
      <h3 className="font-display text-[22px]">{title}</h3>
      <p className="mt-1 text-[12px] text-muted-light">{subtitle}</p>
    </div>
    <div className="px-5">{children}</div>
  </section>
);

export default DashboardPage;
