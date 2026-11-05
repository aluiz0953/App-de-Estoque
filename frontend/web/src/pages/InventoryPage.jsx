import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../store/slices/inventorySlice';
import { matches } from '../utils/search';
import { SORT_OPTIONS, sortProducts } from '../utils/sort';
import PageHead from '../components/PageHead';
import StockMark, { stockState } from '../components/StockMark';
import { money } from '../utils/money';

// Same three buckets the page has always filtered on.
const getStockState = (quantidade, minimo) => {
  if (quantidade <= 0) return 'Sem estoque';
  if (quantidade <= minimo) return 'Estoque baixo';
  return 'Disponível';
};

const STOCK_FILTERS = ['Todos', 'Disponível', 'Estoque baixo', 'Sem estoque'];
const COLUMNS = 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_96px_96px_150px_64px]';

const InventoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, isLoading, error } = useSelector((state) => state.inventory);

  const [searchParams] = useSearchParams(); // the top bar search lands here as ?busca=
  const role = useSelector((state) => state.auth.user?.role);
  const [filters, setFilters] = useState({ tipoProduto: '', linha: '', fragrancia: '', searchTerm: searchParams.get('busca') || '' });
  const [activeTab, setActiveTab] = useState('Todas');
  const [stockFilter, setStockFilter] = useState('Todos');
  const [sort, setSort] = useState('az');
  const [brands, setBrands] = useState([]);

  // The whole active catalogue is loaded once and filtered here: results update as you type, with no
  // request per keystroke. (The API only understands `search`, so the brand tabs and the Tipo / Linha /
  // Fragrância fields could never filter on the server.)
  // ponytail: fine for a few hundred products; move the filters to the API if the catalogue reaches the thousands.
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Searching from the top bar while already on this page changes only the URL: follow it.
  const busca = searchParams.get('busca') || '';
  useEffect(() => {
    setFilters((prev) => (prev.searchTerm === busca ? prev : { ...prev, searchTerm: busca }));
  }, [busca]);

  useEffect(() => {
    const known = Array.from(new Set(products.map((p) => p.linha?.marca?.nome).filter(Boolean)));
    if (known.length) setBrands(known);
  }, [products]);

  const handleFilterChange = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const handleClearFilters = () => {
    setFilters({ tipoProduto: '', linha: '', fragrancia: '', searchTerm: '' });
    setActiveTab('Todas');
    setStockFilter('Todos');
    setSort('az');
  };

  const visible = sortProducts(products, sort).filter((p) => {
    const marca = p.linha?.marca?.nome;
    if (activeTab !== 'Todas' && marca !== activeTab) return false;
    if (!matches(p.tipoProduto, filters.tipoProduto)) return false;
    if (!matches(p.linha?.nome, filters.linha)) return false;
    if (!matches(p.fragrancia, filters.fragrancia)) return false;
    if (!matches([p.nome, p.sku, p.descricao, p.linha?.nome, marca].join(' '), filters.searchTerm)) return false;
    return stockFilter === 'Todos' || getStockState(p.quantidadeTotal, p.estoqueMinimo) === stockFilter;
  });

  const handleExport = () => {
    const header = ['SKU', 'Nome', 'Marca', 'Linha', 'Preco Custo', 'Preco Venda', 'Estoque'];
    const rows = visible.map((p) => [
      p.sku,
      p.nome,
      p.linha?.marca?.nome || '',
      p.linha?.nome || '',
      p.precoCusto,
      p.precoVenda,
      p.quantidadeTotal,
    ]);
    const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estoque.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <PageHead title="Estoque" meta={isLoading ? 'Carregando produtos…' : `${visible.length} ${visible.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`}>
        <button onClick={handleClearFilters} className="btn btn-quiet">
          Limpar filtros
        </button>
        {(role === 'ADMIN' || role === 'MANAGER') && (
          <Link to="/produtos/novo" className="btn btn-primary lg:hidden">
            <span className="mdi mdi-plus text-[16px]" aria-hidden="true" /> Novo produto
          </Link>
        )}
      </PageHead>

      <div className="mb-5 flex flex-wrap gap-x-5 border-b border-border" role="tablist" aria-label="Marca">
        {['Todas', ...brands].map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={activeTab === option}
            onClick={() => setActiveTab(option)}
            className={`tab-link ${activeTab === option ? 'tab-link-active' : ''}`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tipo de produto">
          <input className="input" value={filters.tipoProduto} onChange={(e) => handleFilterChange('tipoProduto', e.target.value)} placeholder="Perfumaria, Cuidados..." />
        </Field>
        <Field label="Linha">
          <input className="input" value={filters.linha} onChange={(e) => handleFilterChange('linha', e.target.value)} placeholder="Kaiak, Ekos..." />
        </Field>
        <Field label="Fragrância">
          <input className="input" value={filters.fragrancia} onChange={(e) => handleFilterChange('fragrancia', e.target.value)} placeholder="Kaiak Tradicional..." />
        </Field>
        <Field label="Buscar (nome, SKU, descrição)">
          <input className="input" value={filters.searchTerm} onChange={(e) => handleFilterChange('searchTerm', e.target.value)} placeholder="Digite para buscar" />
        </Field>
      </div>

      {error && <p className="mb-4 text-[13px] text-danger">Erro ao carregar produtos: {error.message || String(error)}</p>}

      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap gap-x-5 border-b border-border" role="tablist" aria-label="Estado do estoque">
          {STOCK_FILTERS.map((option) => (
            <button
              key={option}
              role="tab"
              aria-selected={stockFilter === option}
              onClick={() => setStockFilter(option)}
              className={`tab-link ${stockFilter === option ? 'tab-link-active' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-[12px] text-muted">
            Ordenar
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-md border border-border bg-surface px-2.5 text-[13px] font-medium text-ink outline-none focus:border-primary"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {visible.length > 0 && (
            <button onClick={handleExport} className="btn btn-quiet">
              <span className="mdi mdi-download text-[16px]" aria-hidden="true" />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="listing" aria-busy="true">
          <div className="listing-body">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="listing-row h-[58px]">
                <span className="h-3 w-1/3 animate-pulse rounded bg-black/10" />
              </div>
            ))}
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="sheet px-5 py-12">
          <p className="text-[14px] font-medium">Nenhum produto com esses filtros.</p>
          <p className="mt-1 text-[13px] text-muted">Limpe os filtros para ver o catálogo inteiro, ou cadastre um produto novo.</p>
          <button onClick={handleClearFilters} className="btn btn-quiet mt-4">
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="listing">
          <div className={`listing-head hidden ${COLUMNS} lg:grid`}>
            <span>Produto</span>
            <span>SKU</span>
            <span className="text-right">Custo</span>
            <span className="text-right">Venda</span>
            <span>Estoque</span>
            <span />
          </div>
          <div className="listing-body">
            {visible.map((product) => {
              const state = stockState(product.quantidadeTotal, product.estoqueMinimo, product.quantidadeVencendoProximos30Dias);
              const precisa = state === 'low' || state === 'expiring' || (state === 'out' && product.estoqueMinimo > 0);
              return (
                <div key={product.id} className={`listing-row grid-cols-2 gap-y-1 ${COLUMNS} hover:shadow-[inset_0_0_0_9999px_rgba(23,32,27,0.04)]`}>
                  <div className="col-span-2 min-w-0 lg:col-span-1">
                    <Link to={`/produtos/${product.id}`} className="block truncate font-medium hover:underline">
                      <span className={precisa ? 'mark' : ''}>{product.nome}</span>
                    </Link>
                    <span className="block truncate text-[12px] text-muted">
                      {product.linha?.marca?.nome || 'N/A'} · {product.linha?.nome || 'N/A'}
                    </span>
                  </div>
                  <span className="truncate font-mono text-[12px] text-muted">{product.sku || 'N/A'}</span>
                  <span className="font-mono tabular-nums text-muted lg:text-right">{money(product.precoCusto)}</span>
                  <span className="font-mono tabular-nums lg:text-right">{money(product.precoVenda)}</span>
                  <span className="flex items-center gap-3">
                    <StockMark state={state} />
                    <span className="font-mono tabular-nums text-muted">{product.quantidadeTotal ?? 0}</span>
                  </span>
                  <div className="col-span-2 flex justify-end gap-1 lg:col-span-1">
                    <button
                      onClick={() => navigate(`/produtos/${product.id}`)}
                      aria-label={`Ver ${product.nome}`}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-black/5 hover:text-ink"
                    >
                      <span className="mdi mdi-eye-outline text-[16px]" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => navigate(`/produtos/${product.id}/editar`)}
                      aria-label={`Editar ${product.nome}`}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-black/5 hover:text-ink"
                    >
                      <span className="mdi mdi-pencil-outline text-[16px]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="field-label">{label}</span>
    {children}
  </label>
);

export default InventoryPage;
