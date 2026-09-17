import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProducts } from '../store/slices/inventorySlice';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const getStockState = (quantidade, minimo) => {
  if (quantidade <= 0) return 'Sem estoque';
  if (quantidade <= minimo) return 'Estoque baixo';
  return 'Disponível';
};

const STATE_BADGE = {
  Disponível: 'bg-[#dce6d8] text-[#5f7658]',
  'Estoque baixo': 'bg-[#f0d6c5] text-[#94634d]',
  'Sem estoque': 'bg-[#ded7d4] text-[#716562]',
};

const InventoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, isLoading, error } = useSelector((state) => state.inventory);

  const [filters, setFilters] = useState({ tipoProduto: '', linha: '', fragrancia: '', searchTerm: '' });
  const [activeTab, setActiveTab] = useState('Todas');
  const [stockFilter, setStockFilter] = useState('Todos');
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const params = {};
    if (activeTab !== 'Todas') params.marcaNome = activeTab;
    if (filters.tipoProduto) params.tipoProduto = filters.tipoProduto;
    if (filters.linha) params.linhaNome = filters.linha;
    if (filters.fragrancia) params.fragrancia = filters.fragrancia;
    if (filters.searchTerm) params.search = filters.searchTerm;
    dispatch(fetchProducts(params));
  }, [dispatch, activeTab, filters.tipoProduto, filters.linha, filters.fragrancia, filters.searchTerm]);

  useEffect(() => {
    const known = Array.from(new Set(products.map((p) => p.linha?.marca?.nome).filter(Boolean)));
    if (known.length) setBrands(known);
  }, [products]);

  const handleFilterChange = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const handleClearFilters = () => {
    setFilters({ tipoProduto: '', linha: '', fragrancia: '', searchTerm: '' });
    setActiveTab('Todas');
    setStockFilter('Todos');
  };

  const visible = products.filter((p) => {
    if (stockFilter === 'Todos') return true;
    return getStockState(p.quantidadeTotal, p.estoqueMinimo) === stockFilter;
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
    <main className="p-5 md:p-9">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Estoque / 01</p>
          <h2 className="font-display mt-3 text-[34px] tracking-[-0.03em] md:text-[40px]">Produtos em estoque.</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClearFilters}
            className="rounded-full border border-border px-4 py-2.5 text-[12px] text-muted hover:bg-brand-bg"
          >
            Limpar filtros
          </button>
          <Link
            to="/produtos/novo"
            className="pressable flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark"
          >
            <span className="mdi mdi-plus text-[15px]" /> Novo produto
          </Link>
        </div>
      </div>

      {/* Brand tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['Todas', ...brands].map((option) => (
          <button
            key={option}
            onClick={() => setActiveTab(option)}
            className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
              activeTab === option ? 'bg-primary text-primary-50' : 'bg-surface text-muted border border-border hover:bg-brand-bg'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tipo de produto">
          <input
            value={filters.tipoProduto}
            onChange={(e) => handleFilterChange('tipoProduto', e.target.value)}
            placeholder="Perfumaria, Cuidados..."
          />
        </Field>
        <Field label="Linha">
          <input value={filters.linha} onChange={(e) => handleFilterChange('linha', e.target.value)} placeholder="Kaiak, Ekos..." />
        </Field>
        <Field label="Fragrância">
          <input
            value={filters.fragrancia}
            onChange={(e) => handleFilterChange('fragrancia', e.target.value)}
            placeholder="Kaiak Tradicional..."
          />
        </Field>
        <Field label="Buscar (nome, SKU, descrição)">
          <input
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="Digite para buscar"
          />
        </Field>
      </div>

      {error && <p className="mb-4 text-[13px] text-danger">Erro ao carregar produtos: {error.message || String(error)}</p>}

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_35px_rgba(63,47,35,0.04)]">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-[24px]">Produtos encontrados ({visible.length})</h3>
            <p className="mt-1 text-[12px] text-muted-light">Todo produto, contabilizado.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-lg border border-border bg-brand-bg p-1">
              {['Todos', 'Disponível', 'Estoque baixo', 'Sem estoque'].map((option) => (
                <button
                  key={option}
                  onClick={() => setStockFilter(option)}
                  className={`rounded-md px-3 py-1.5 text-[10px] font-medium ${
                    stockFilter === option ? 'bg-primary text-primary-50' : 'text-muted'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {visible.length > 0 && (
              <button onClick={handleExport} className="text-[12px] font-medium text-secondary-dark hover:text-primary">
                <span className="mdi mdi-download mr-1" />
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
            <p className="mt-4 text-[12px] text-muted-light">Carregando produtos...</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mdi mdi-filter-variant mx-auto mb-3 block text-[20px] text-secondary" />
            <p className="font-display text-[22px]">Nada por aqui.</p>
            <p className="mt-1 text-[12px] text-muted-light">Experimente limpar os filtros ou cadastre um produto.</p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.75fr_0.8fr_0.65fr_0.6fr] gap-4 border-b border-border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-light lg:grid">
              <span>Produto</span>
              <span>SKU</span>
              <span className="text-right">Preço custo</span>
              <span className="text-right">Preço venda</span>
              <span className="text-center">Estoque</span>
              <span />
            </div>
            <div>
              {visible.map((product) => {
                const state = getStockState(product.quantidadeTotal, product.estoqueMinimo);
                return (
                  <div
                    key={product.id}
                    className="grid grid-cols-2 gap-3 border-b border-[#eee7df] px-5 py-4 last:border-0 hover:bg-brand-bg/60 lg:grid-cols-[1.4fr_0.8fr_0.75fr_0.8fr_0.65fr_0.6fr] lg:items-center lg:gap-4"
                  >
                    <div className="col-span-2 lg:col-span-1">
                      <p className="text-[13px] font-medium">{product.nome}</p>
                      <p className="mt-0.5 text-[10px] text-muted-light">
                        {product.linha?.marca?.nome || 'N/A'} · {product.linha?.nome || 'N/A'}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-muted-light tabular-nums">{product.sku || 'N/A'}</span>
                    <span className="text-[12px] text-muted tabular-nums lg:text-right">{money(product.precoCusto)}</span>
                    <span className="text-[12px] font-medium tabular-nums lg:text-right">{money(product.precoVenda)}</span>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-center font-mono text-[9px] uppercase tracking-[0.08em] tabular-nums lg:mx-auto ${STATE_BADGE[state]}`}
                    >
                      {product.quantidadeTotal} · {state}
                    </span>
                    <div className="col-span-2 flex gap-1 lg:col-span-1 lg:justify-end">
                      <button
                        onClick={() => navigate(`/produtos/${product.id}`)}
                        aria-label={`Ver ${product.nome}`}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-light hover:bg-[#eee7df] hover:text-ink"
                      >
                        <span className="mdi mdi-eye-outline text-[15px]" />
                      </button>
                      <button
                        onClick={() => navigate(`/produtos/${product.id}/editar`)}
                        aria-label={`Editar ${product.nome}`}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-light hover:bg-[#eee7df] hover:text-ink"
                      >
                        <span className="mdi mdi-pencil-outline text-[14px]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
};

const Field = ({ label, children }) => (
  <label className="grid gap-2">
    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">{label}</span>
    <span className="[&>input]:h-10 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-border [&>input]:bg-brand-bg [&>input]:px-3 [&>input]:text-[12px] [&>input]:outline-none [&>input]:placeholder:text-muted-light [&>input]:focus:border-secondary-dark">
      {children}
    </span>
  </label>
);

export default InventoryPage;
