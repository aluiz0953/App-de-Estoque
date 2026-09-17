import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchProducts } from '../store/slices/inventorySlice';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';
import { useFetchMovimentacoes } from '../hooks/useFetchMovimentacoes';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const MARCA_CORES = ['#a96d6e', '#7a966e', '#c98a52', '#6b7fa8', '#8f6fa8', '#c1666b'];

function agruparSaidaPorSemanaEMarca(movimentacoes) {
  if (!movimentacoes?.length) return { semanas: [], marcas: [] };

  const marcas = Array.from(
    new Set(movimentacoes.map((m) => m.produto?.linha?.marca?.nome || 'Outras'))
  ).sort();

  const inicioSemana = (date) => {
    const d = new Date(date);
    const diaSemana = d.getDay();
    d.setDate(d.getDate() - diaSemana);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const porSemana = new Map();
  for (const mov of movimentacoes) {
    const semana = inicioSemana(mov.dataMovimentacao);
    const chave = semana.toISOString();
    if (!porSemana.has(chave)) {
      const label = semana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const linha = { semana: label, _data: semana };
      marcas.forEach((m) => (linha[m] = 0));
      porSemana.set(chave, linha);
    }
    const marca = mov.produto?.linha?.marca?.nome || 'Outras';
    porSemana.get(chave)[marca] += mov.quantidade;
  }

  const semanas = Array.from(porSemana.values()).sort((a, b) => a._data - b._data);
  return { semanas, marcas };
}

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading: isLoadingProducts } = useSelector((state) => state.inventory);
  const { data: resumo, isLoading: isLoadingResumo, error: errorResumo } = useFetchEstoqueResumo();
  const { data: movimentacoes, isLoading: isLoadingMov, error: errorMov } = useFetchMovimentacoes(45);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const { semanas, marcas } = useMemo(() => agruparSaidaPorSemanaEMarca(movimentacoes), [movimentacoes]);
  const marcaMaisVendida = useMemo(() => {
    if (!marcas.length) return null;
    const totais = marcas.map((m) => [m, semanas.reduce((sum, s) => sum + s[m], 0)]);
    totais.sort((a, b) => b[1] - a[1]);
    return totais[0];
  }, [marcas, semanas]);

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
        <Panel
          title="Saída por marca"
          subtitle={
            marcaMaisVendida
              ? `${marcaMaisVendida[0]} lidera com ${marcaMaisVendida[1]} unidades nos últimos 45 dias`
              : 'Unidades vendidas por semana, últimos 45 dias'
          }
        >
          {isLoadingMov ? (
            <p className="py-16 text-center text-[12px] text-muted-light">Carregando movimentações...</p>
          ) : errorMov ? (
            <p className="py-16 text-center text-[13px] text-danger">Erro ao carregar movimentações: {errorMov.message}</p>
          ) : semanas.length === 0 ? (
            <p className="py-16 text-center text-[12px] text-muted-light">Nenhuma saída de estoque registrada ainda.</p>
          ) : (
            <div className="h-72 pb-5 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semanas} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {marcas.map((marca, i) => (
                    <Bar key={marca} dataKey={marca} stackId="saida" fill={MARCA_CORES[i % MARCA_CORES.length]} radius={i === marcas.length - 1 ? [4, 4, 0, 0] : 0} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
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
