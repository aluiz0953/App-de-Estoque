import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import MovimentacoesChart from '../components/MovimentacoesChart';
import PageHead from '../components/PageHead';
import StockMark, { stockState } from '../components/StockMark';
import { fetchProducts } from '../store/slices/inventorySlice';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';
import { useFetchMovimentacoes } from '../hooks/useFetchMovimentacoes';
import { money } from '../utils/money';

const PERIODOS = [
  { dias: 7, label: '7 dias' },
  { dias: 30, label: '30 dias' },
  { dias: 365, label: 'Este ano' },
];

// Out of stock first, then low, then expiring; what needs the team the most sits at the top of the list.
const ORDEM = { out: 0, low: 1, expiring: 2 };
const ATENCAO_COLS = 'grid-cols-[minmax(0,1fr)_auto_44px] gap-x-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_72px_72px]';

const Total = ({ valor, children }) => (
  <p className="px-5 py-3 text-[13px] text-muted">
    <span className="mr-1.5 font-mono text-[15px] font-semibold tabular-nums text-ink">{valor}</span>
    {children}
  </p>
);

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading: isLoadingProducts } = useSelector((state) => state.inventory);
  const [dias, setDias] = useState(30);
  const { data: resumo, isLoading: isLoadingResumo, error: errorResumo } = useFetchEstoqueResumo();
  const { data: movimentacoes, isLoading: isLoadingMov, error: errorMov } = useFetchMovimentacoes(dias);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const semMovimentacao = !movimentacoes || (movimentacoes.entradas.length === 0 && movimentacoes.saidas.length === 0);

  const atencao = useMemo(() => {
    const rows = [];
    for (const p of products) {
      const venc = p.quantidadeVencendoProximos30Dias ?? 0;
      const state = stockState(p.quantidadeTotal, p.estoqueMinimo, venc);
      // A product with no minimum that is simply at zero is not an alert (a new catalogue starts empty).
      const precisa = state === 'low' || state === 'expiring' || (state === 'out' && p.estoqueMinimo > 0);
      if (precisa) rows.push({ product: p, state });
    }
    return rows.sort((a, b) => ORDEM[a.state] - ORDEM[b.state] || a.product.nome.localeCompare(b.product.nome, 'pt-BR'));
  }, [products]);

  const abaixoDoMinimo = atencao.filter((r) => r.state !== 'expiring').length;
  const vencendo = atencao.filter((r) => (r.product.quantidadeVencendoProximos30Dias ?? 0) > 0).length;
  const recentes = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 6), [products]);
  const semEstoqueLancado = !isLoadingResumo && !errorResumo && (resumo?.totalLotesAtivos ?? 0) === 0;

  // A row whose quantity changed since the last load flips once (reduced motion: no flip).
  const anterior = useRef(new Map());
  const mudou = new Set();
  atencao.forEach(({ product }) => {
    const antes = anterior.current.get(product.id);
    if (antes !== undefined && antes !== product.quantidadeTotal) mudou.add(product.id);
  });
  useEffect(() => {
    anterior.current = new Map(products.map((p) => [p.id, p.quantidadeTotal]));
  }, [products]);

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <PageHead
        title="Painel"
        meta={errorResumo ? 'Falha ao sincronizar' : isLoadingResumo ? 'Carregando…' : 'Atualizado agora'}
      />

      {errorResumo ? (
        <p className="mb-6 text-[13px] text-danger">Erro ao carregar resumo do estoque: {errorResumo.message}</p>
      ) : (
        <div className="sheet mb-8 flex flex-wrap divide-x divide-border" aria-label="Resumo do estoque">
          <Total valor={isLoadingResumo ? '…' : resumo?.totalProdutos ?? 0}>produtos</Total>
          <Total valor={isLoadingResumo ? '…' : money(resumo?.valorTotalEstoque)}>em estoque</Total>
          <Total valor={isLoadingProducts ? '…' : abaixoDoMinimo}>abaixo do mínimo</Total>
          <Total valor={isLoadingProducts ? '…' : vencendo}>vencendo em 30 dias</Total>
        </div>
      )}

      <section aria-labelledby="precisa" className="mb-8">
        <h2 id="precisa" className="mb-3 text-[15px] font-semibold">
          Precisa de você{atencao.length > 0 ? ` (${atencao.length})` : ''}
        </h2>
        {isLoadingProducts ? (
          <div className="listing">
            <div className="listing-body" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="listing-row h-[46px]">
                  <span className="h-3 w-1/3 animate-pulse rounded bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        ) : semEstoqueLancado ? (
          <div className="sheet px-5 py-6">
            <p className="text-[14px] font-medium">Nenhum estoque lançado ainda.</p>
            <p className="mt-1 max-w-[62ch] text-[13px] text-muted">
              Cada entrada de romaneio vira um lote com validade, e é a partir dela que aparecem aqui o estoque baixo e o que está
              vencendo. A entrada é feita no app do celular: Mais, depois Entrada de romaneio.
            </p>
            <Link to="/estoque" className="btn btn-quiet mt-4">
              Ver o catálogo
            </Link>
          </div>
        ) : atencao.length === 0 ? (
          <div className="sheet px-5 py-6 text-[13px] text-muted">Nada pede atenção agora. Nenhum produto abaixo do mínimo e nada vencendo em 30 dias.</div>
        ) : (
          <div className="listing">
            <div className={`listing-head ${ATENCAO_COLS}`}>
              <span>Produto</span>
              <span>Estado</span>
              <span className="text-right">Estoque</span>
              <span className="hidden text-right sm:block">Mínimo</span>
            </div>
            <div className="listing-body">
              {atencao.slice(0, 12).map(({ product: p, state }, i) => (
                <Link
                  key={p.id}
                  to={`/produtos/${p.id}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className={`listing-row row-in ${ATENCAO_COLS} ${mudou.has(p.id) ? 'flap' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      <span className="mark">{p.nome}</span>
                    </span>
                    <span className="block truncate text-[12px] text-muted">
                      {p.linha?.marca?.nome || 'N/A'} · {p.linha?.nome || 'N/A'}
                    </span>
                  </span>
                  <StockMark state={state} />
                  <span className="text-right font-mono tabular-nums">{p.quantidadeTotal ?? 0}</span>
                  <span className="hidden text-right font-mono tabular-nums text-muted sm:block">{p.estoqueMinimo ?? 0}</span>
                </Link>
              ))}
            </div>
            {atencao.length > 12 && (
              <Link to="/estoque" className="block border-t border-border px-5 py-3 text-[13px] font-medium text-primary-dark hover:underline dark:text-primary">
                Ver os outros {atencao.length - 12} no Estoque
              </Link>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="mov" className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 id="mov" className="text-[15px] font-semibold">
            Movimentações
          </h2>
          <div className="flex gap-4 border-b border-border" role="tablist" aria-label="Período">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                role="tab"
                aria-selected={dias === p.dias}
                onClick={() => setDias(p.dias)}
                className={`tab-link ${dias === p.dias ? 'tab-link-active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="sheet px-5 py-4">
          {isLoadingMov ? (
            <p className="py-16 text-center text-[13px] text-muted">Carregando movimentações…</p>
          ) : errorMov ? (
            <p className="py-16 text-center text-[13px] text-danger">Erro ao carregar movimentações: {errorMov.message}</p>
          ) : semMovimentacao ? (
            <p className="py-12 text-center text-[13px] text-muted">Nenhuma entrada ou saída neste período.</p>
          ) : (
            <MovimentacoesChart entradas={movimentacoes.entradas} saidas={movimentacoes.saidas} dias={dias} />
          )}
        </div>
      </section>

      <section aria-labelledby="recentes">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="recentes" className="text-[15px] font-semibold">
            Últimos cadastrados
          </h2>
          <Link to="/estoque" className="text-[13px] font-medium text-primary-dark hover:underline dark:text-primary">
            Ver todos
          </Link>
        </div>
        {recentes.length === 0 ? (
          <div className="sheet px-5 py-6 text-[13px] text-muted">Nenhum produto cadastrado ainda.</div>
        ) : (
          <div className="listing">
            <div className="listing-head grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_96px]">
              <span>Produto</span>
              <span>SKU</span>
              <span className="text-right">Preço venda</span>
            </div>
            <div className="listing-body">
              {recentes.map((p) => (
                <Link key={p.id} to={`/produtos/${p.id}`} className="listing-row grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_96px]">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.nome}</span>
                    <span className="block truncate text-[12px] text-muted">
                      {p.linha?.marca?.nome || 'N/A'} · {p.linha?.nome || 'N/A'}
                    </span>
                  </span>
                  <span className="truncate font-mono text-[12px] text-muted">{p.sku}</span>
                  <span className="text-right font-mono tabular-nums">{money(p.precoVenda)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;
