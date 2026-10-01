import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import MovimentacoesChart from '../components/MovimentacoesChart';
import { fetchProducts } from '../store/slices/inventorySlice';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';
import { useFetchMovimentacoes } from '../hooks/useFetchMovimentacoes';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const PERIODOS = [
  { dias: 7, label: 'Últimos 7 dias' },
  { dias: 30, label: 'Últimos 30 dias' },
  { dias: 365, label: 'Este ano' },
];

// Tile colours / bottle shapes cycle through the products, like the Figma product rows.
const TONS = ['bg-[#faedf1] text-[#d45f80]', 'bg-[#e9f5ec] text-[#358d50]', 'bg-[#f1ecf5] text-[#8665a4]', 'bg-[#faecea] text-[#c95b55]'];
const FORMAS = ['', 'tall', 'wide'];

const METRIC_TONS = {
  green: 'bg-[#eaf7ee] text-[#147a37]',
  pink: 'bg-[#fbeef2] text-[#ba4566]',
  rose: 'bg-[#fff0ee] text-[#bc5b58]',
  purple: 'bg-[#f4eff8] text-[#765394]',
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { products, isLoading: isLoadingProducts } = useSelector((state) => state.inventory);
  const [dias, setDias] = useState(30);
  const { data: resumo, isLoading: isLoadingResumo, error: errorResumo } = useFetchEstoqueResumo();
  const { data: movimentacoes, isLoading: isLoadingMov, error: errorMov } = useFetchMovimentacoes(dias);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const semMovimentacao = !movimentacoes || (movimentacoes.entradas.length === 0 && movimentacoes.saidas.length === 0);

  const estoqueBaixo = useMemo(() => products.filter((p) => p.quantidadeTotal <= p.estoqueMinimo), [products]);
  const vencendo = useMemo(() => products.filter((p) => p.quantidadeVencendoProximos30Dias > 0), [products]);
  const recentes = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 5), [products]);

  const nome = (user?.fullName || user?.nome || user?.user || user?.username || '').split(' ')[0];
  const nomeCapitalizado = nome ? nome.charAt(0).toUpperCase() + nome.slice(1) : '';

  return (
    <main className="mx-auto max-w-[1480px] p-5 md:p-9">
      <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow !text-primary">Painel de controle</p>
          <h1 className="font-display mt-2 text-[28px] leading-tight tracking-[-0.03em] md:text-[34px]">
            Olá{nomeCapitalizado ? `, ${nomeCapitalizado}` : ''}.{' '}
            <em className="text-secondary-dark">
              {estoqueBaixo.length > 0 ? 'Alguns itens pedem atenção.' : 'Seu estoque está sob controle.'}
            </em>
          </h1>
          <p className="mt-2 text-[12px] text-muted">Acompanhe produtos, vendas e alertas em um só lugar.</p>
        </div>
        <label className="relative flex min-w-[172px] flex-col rounded-[10px] border border-border bg-surface px-3 py-2">
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-muted-light">Período</span>
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="appearance-none bg-transparent pr-6 text-[11px] font-semibold text-ink outline-none"
          >
            {PERIODOS.map((p) => (
              <option key={p.dias} value={p.dias}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="mdi mdi-chevron-down pointer-events-none absolute bottom-2.5 right-3 text-[16px] text-muted" aria-hidden="true" />
        </label>
      </div>

      {errorResumo ? (
        <p className="text-danger">Erro ao carregar resumo do estoque: {errorResumo.message}</p>
      ) : (
        <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do estoque">
          <MetricCard label="Produtos ativos" value={resumo?.totalProdutos ?? 0} detail={`${resumo?.totalLotesAtivos ?? 0} lotes ativos`} icon="package-variant-closed" tone="green" loading={isLoadingResumo} />
          <MetricCard label="Valor do estoque" value={money(resumo?.valorTotalEstoque)} detail="Preço de venda em estoque" icon="chart-bar" tone="pink" loading={isLoadingResumo} />
          <MetricCard label="Itens com estoque baixo" value={estoqueBaixo.length} detail={`${vencendo.length} vencendo em 30 dias`} icon="alert-outline" tone="rose" loading={isLoadingProducts} />
          <MetricCard label="Lucro potencial" value={money(resumo?.lucroPotencial)} detail="Se tudo for vendido" icon="trending-up" tone="purple" loading={isLoadingResumo} />
        </section>
      )}

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.16fr)_minmax(340px,0.84fr)]">
        <Panel
          title="Produtos recentes"
          subtitle="Últimos cadastrados no seu catálogo"
          flush
          action={
            <Link to="/estoque" className="flex items-center gap-0.5 text-[10px] font-bold text-primary-dark hover:underline dark:text-primary">
              Ver todos <span className="mdi mdi-chevron-right text-[15px]" aria-hidden="true" />
            </Link>
          }
        >
          <div className="grid grid-cols-[minmax(0,1fr)_110px_92px] gap-3 border-t border-border bg-brand-bg px-5 py-2.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-muted-light">
            <span>Produto</span>
            <span>Estoque</span>
            <span className="text-right">Preço</span>
          </div>
          {isLoadingProducts ? (
            <p className="py-10 text-center text-[12px] text-muted-light">Carregando...</p>
          ) : recentes.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-muted-light">Nenhum produto cadastrado ainda.</p>
          ) : (
            recentes.map((p, i) => {
              const baixo = p.quantidadeTotal <= p.estoqueMinimo;
              return (
                <Link
                  key={p.id}
                  to={`/produtos/${p.id}`}
                  className="grid min-h-[68px] grid-cols-[minmax(0,1fr)_110px_92px] items-center gap-3 border-t border-border px-5 transition hover:bg-brand-bg/60"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] ${TONS[i % TONS.length]}`}>
                      <div className={`bottle ${FORMAS[i % FORMAS.length]}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold">{p.nome}</p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-light">
                        {p.linha?.marca?.nome || 'N/A'} · {p.sku}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${baixo ? 'bg-[#fff0ee] text-[#b94c4c]' : 'bg-[#eaf7ee] text-[#147a37]'}`}>
                      {baixo ? 'Baixo' : 'Em estoque'}
                    </span>
                    <small className="text-[9px] text-muted-light">{p.quantidadeTotal} un.</small>
                  </div>
                  <strong className="text-right text-[11px] tabular-nums">{money(p.precoVenda)}</strong>
                </Link>
              );
            })
          )}
        </Panel>

        <div className="grid content-start gap-4">
          <Panel title="Movimentações" subtitle="Entradas e saídas no período">
            <div className="pb-1">
              {isLoadingMov ? (
                <p className="py-16 text-center text-[12px] text-muted-light">Carregando movimentações...</p>
              ) : errorMov ? (
                <p className="py-16 text-center text-[13px] text-danger">Erro ao carregar movimentações: {errorMov.message}</p>
              ) : semMovimentacao ? (
                <p className="py-16 text-center text-[12px] text-muted-light">Nenhuma movimentação neste período.</p>
              ) : (
                <MovimentacoesChart entradas={movimentacoes.entradas} saidas={movimentacoes.saidas} dias={dias} />
              )}
            </div>
          </Panel>

          <Link
            to="/estoque"
            className="grid grid-cols-[38px_1fr_30px] items-center gap-3 rounded-[14px] border border-[#f2d8de] bg-gradient-to-br from-[#fff7f9] to-white p-4 transition hover:shadow-md dark:border-border dark:from-[#2a1d22] dark:to-surface"
          >
            <span className="grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-[#fbeef2] text-[#ba4566]">
              <span className="mdi mdi-alert-outline text-[19px]" aria-hidden="true" />
            </span>
            <div>
              <strong className="text-[13px]">
                {estoqueBaixo.length === 0
                  ? 'Nenhum produto precisa de atenção'
                  : `${estoqueBaixo.length} ${estoqueBaixo.length === 1 ? 'produto precisa' : 'produtos precisam'} de atenção`}
              </strong>
              <p className="mt-0.5 text-[11px] text-muted">Itens abaixo do estoque mínimo podem afetar suas próximas vendas.</p>
            </div>
            <span className="mdi mdi-chevron-right text-[20px] text-muted" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Estoque crítico" subtitle="Produtos no ou abaixo do mínimo">
          {isLoadingProducts ? (
            <p className="py-8 text-center text-[12px] text-muted-light">Carregando...</p>
          ) : estoqueBaixo.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-light">Nenhum produto com estoque crítico.</p>
          ) : (
            <div className="divide-y divide-border border-t border-border">
              {estoqueBaixo.slice(0, 6).map((p) => (
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
            <div className="divide-y divide-border border-t border-border">
              {vencendo.slice(0, 6).map((p) => (
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

const MetricCard = ({ label, value, detail, icon, tone, loading }) => (
  <article className="flex items-start gap-3.5 rounded-[15px] border border-border bg-surface p-[19px] shadow-[0_3px_14px_rgba(32,61,43,0.025)]">
    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[11px] ${METRIC_TONS[tone]}`}>
      <span className={`mdi mdi-${icon} text-[21px]`} aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <p className="mb-1 truncate text-[10px] text-muted">{label}</p>
      <strong className="block text-[21px] leading-[1.15] tracking-[-0.5px] tabular-nums">{loading ? '···' : value}</strong>
      {detail && <span className="mt-1.5 block truncate text-[9px] font-semibold text-muted-light">{detail}</span>}
    </div>
  </article>
);

const Panel = ({ title, subtitle, action, flush, children }) => (
  <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_3px_14px_rgba(32,61,43,0.025)]">
    <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
      <div>
        <h2 className="text-[14px] font-bold tracking-[-0.2px]">{title}</h2>
        <p className="mt-1 text-[12px] text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
    <div className={flush ? '' : 'px-5'}>{children}</div>
  </section>
);

export default DashboardPage;
