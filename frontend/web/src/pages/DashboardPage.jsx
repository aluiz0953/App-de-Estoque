import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import MovimentacoesChart from '../components/MovimentacoesChart';
import { fetchProducts } from '../store/slices/inventorySlice';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';
import { useFetchMovimentacoes } from '../hooks/useFetchMovimentacoes';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading: isLoadingProducts } = useSelector((state) => state.inventory);
  const { data: resumo, isLoading: isLoadingResumo, error: errorResumo } = useFetchEstoqueResumo();
  const { data: movimentacoes, isLoading: isLoadingMov, error: errorMov } = useFetchMovimentacoes(45);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const semMovimentacao = !movimentacoes || (movimentacoes.entradas.length === 0 && movimentacoes.saidas.length === 0);

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

      <div className="mt-8">
        <Panel title="Movimentações" subtitle="Entradas e saídas nos últimos 45 dias">
          {isLoadingMov ? (
            <p className="py-16 text-center text-[12px] text-muted-light">Carregando movimentações...</p>
          ) : errorMov ? (
            <p className="py-16 text-center text-[13px] text-danger">Erro ao carregar movimentações: {errorMov.message}</p>
          ) : semMovimentacao ? (
            <p className="py-16 text-center text-[12px] text-muted-light">Nenhuma movimentação de estoque registrada ainda.</p>
          ) : (
            <MovimentacoesChart entradas={movimentacoes.entradas} saidas={movimentacoes.saidas} dias={45} />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Estoque crítico" subtitle="Produtos no ou abaixo do mínimo">
          {isLoadingProducts ? (
            <p className="py-8 text-center text-[12px] text-muted-light">Carregando...</p>
          ) : estoqueBaixo.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-light">Nenhum produto com estoque crítico.</p>
          ) : (
            <div className="divide-y divide-[#edf0ed]">
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
                  <span className="shrink-0 rounded-full bg-[#eceeed] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#5f6762] tabular-nums">
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
            <div className="divide-y divide-[#edf0ed]">
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
                  <span className="shrink-0 rounded-full bg-[#fdf0d9] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a5a12] tabular-nums">
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
        ? 'bg-[#fbeef2] text-[#ba4566]'
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
  <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_35px_rgba(32,61,43,0.04)]">
    <div className="border-b border-border p-5">
      <h3 className="font-display text-[22px]">{title}</h3>
      <p className="mt-1 text-[12px] text-muted-light">{subtitle}</p>
    </div>
    <div className="px-5">{children}</div>
  </section>
);

export default DashboardPage;
