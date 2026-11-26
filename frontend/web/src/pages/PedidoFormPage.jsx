import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { createPedido } from '../store/slices/pedidosSlice';
import apiService from '../services/api';
import PageHead from '../components/PageHead';
import { money } from '../utils/money';

const PedidoFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Cliente: search existing, or a quick inline create.
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteResults, setClienteResults] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ nome: '', telefone: '', email: '' });
  const clienteDebounce = useRef(null);

  // Itens: search products, add with a quantity.
  const [produtoSearch, setProdutoSearch] = useState('');
  const [produtoResults, setProdutoResults] = useState([]);
  const [itens, setItens] = useState([]);
  const produtoDebounce = useRef(null);

  const [observacoes, setObservacoes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (clienteDebounce.current) clearTimeout(clienteDebounce.current);
    if (clienteSearch.trim().length < 2) {
      setClienteResults([]);
      return;
    }
    clienteDebounce.current = setTimeout(() => {
      apiService.getClientes({ search: clienteSearch.trim() }).then((r) => setClienteResults((r || []).slice(0, 6)));
    }, 300);
    return () => clearTimeout(clienteDebounce.current);
  }, [clienteSearch]);

  useEffect(() => {
    if (produtoDebounce.current) clearTimeout(produtoDebounce.current);
    if (produtoSearch.trim().length < 2) {
      setProdutoResults([]);
      return;
    }
    produtoDebounce.current = setTimeout(() => {
      apiService.getProducts({ search: produtoSearch.trim() }).then((r) => setProdutoResults((r || []).slice(0, 6)));
    }, 300);
    return () => clearTimeout(produtoDebounce.current);
  }, [produtoSearch]);

  const addItem = (produto) => {
    setItens((prev) => {
      const existing = prev.find((i) => i.produtoId === produto.id);
      if (existing) {
        return prev.map((i) => (i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...prev, { produtoId: produto.id, nome: produto.nome, sku: produto.sku, precoVenda: produto.precoVenda, quantidade: 1 }];
    });
    setProdutoSearch('');
    setProdutoResults([]);
  };

  const updateQuantidade = (produtoId, quantidade) => {
    const qty = Math.max(1, parseInt(quantidade, 10) || 1);
    setItens((prev) => prev.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: qty } : i)));
  };

  const removeItem = (produtoId) => setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));

  const total = itens.reduce((sum, i) => sum + i.precoVenda * i.quantidade, 0);

  const isValid = (selectedCliente || newCliente.nome.trim()) && itens.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      let clienteId = selectedCliente?.id;
      if (!clienteId) {
        const created = await apiService.createCliente(newCliente);
        clienteId = created.id;
      }
      const result = await dispatch(
        createPedido({
          clienteId,
          observacoes,
          itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        })
      ).unwrap();
      navigate(`/pedidos/${result.id}`);
    } catch (err) {
      setSaveError(err?.message || err || 'Erro ao criar pedido');
    } finally {
      setIsSaving(false);
    }
  };

  const dropdown = 'absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-[0_8px_24px_-8px_rgba(23,32,27,0.25)]';
  const dropdownItem = 'flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-left text-[13px] last:border-0 hover:bg-brand-bg';

  return (
    <main className="mx-auto max-w-[860px] px-5 py-6 md:px-9 md:py-8">
      <Link to="/pedidos" className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink">
        <span className="mdi mdi-arrow-left" aria-hidden="true" /> Pedidos
      </Link>
      <PageHead title="Novo pedido" meta="O pedido só mexe no estoque quando for confirmado." />

      <form onSubmit={handleSubmit}>
        <h2 className="mb-3 text-[15px] font-semibold">Cliente</h2>
        {selectedCliente ? (
          <div className="sheet mb-8 flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[13px] font-medium">{selectedCliente.nome}</p>
              <p className="text-[12px] text-muted">{selectedCliente.telefone || selectedCliente.email}</p>
            </div>
            <button type="button" onClick={() => setSelectedCliente(null)} aria-label="Trocar cliente" className="text-muted hover:text-danger">
              <span className="mdi mdi-close-circle text-[18px]" aria-hidden="true" />
            </button>
          </div>
        ) : showNewCliente ? (
          <div className="mb-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={newCliente.nome} onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })} placeholder="Nome" aria-label="Nome do cliente" className="input" />
              <input value={newCliente.telefone} onChange={(e) => setNewCliente({ ...newCliente, telefone: e.target.value })} placeholder="Telefone" aria-label="Telefone" className="input" />
              <input value={newCliente.email} onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })} placeholder="E-mail" aria-label="E-mail" className="input" />
            </div>
            <button type="button" onClick={() => setShowNewCliente(false)} className="mt-2 text-[13px] font-medium text-primary-dark hover:underline dark:text-primary">
              Buscar cliente existente
            </button>
          </div>
        ) : (
          <div className="relative mb-8 flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <input
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                placeholder="Buscar cliente por nome..."
                aria-label="Buscar cliente"
                className="input"
              />
              {clienteResults.length > 0 && (
                <div className={dropdown}>
                  {clienteResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCliente(c);
                        setClienteResults([]);
                        setClienteSearch('');
                      }}
                      className={dropdownItem}
                    >
                      <span className="truncate">
                        {c.nome} {c.telefone ? `· ${c.telefone}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setShowNewCliente(true)} className="text-[13px] font-medium text-primary-dark hover:underline dark:text-primary">
              + Novo cliente
            </button>
          </div>
        )}

        <h2 className="mb-3 text-[15px] font-semibold">Itens</h2>
        <div className="relative mb-4">
          <input
            value={produtoSearch}
            onChange={(e) => setProdutoSearch(e.target.value)}
            placeholder="Buscar produto por nome ou SKU..."
            aria-label="Buscar produto"
            className="input"
          />
          {produtoResults.length > 0 && (
            <div className={dropdown}>
              {produtoResults.map((p) => (
                <button key={p.id} type="button" onClick={() => addItem(p)} className={dropdownItem}>
                  <span className="truncate">
                    {p.nome} · <span className="font-mono text-[12px] text-muted">{p.sku}</span>
                  </span>
                  <span className="font-mono tabular-nums text-muted">{money(p.precoVenda)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {itens.length > 0 ? (
          <div className="listing mb-8">
            <div className="listing-body">
              {itens.map((item) => (
                <div key={item.produtoId} className="listing-row grid-cols-[minmax(0,1fr)_72px_100px_28px]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.nome}</p>
                    <p className="font-mono text-[12px] text-muted">
                      {item.sku} · {money(item.precoVenda)}/un.
                    </p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => updateQuantidade(item.produtoId, e.target.value)}
                    aria-label={`Quantidade de ${item.nome}`}
                    className="input h-9 px-2 text-center font-mono"
                  />
                  <span className="text-right font-mono tabular-nums">{money(item.precoVenda * item.quantidade)}</span>
                  <button type="button" onClick={() => removeItem(item.produtoId)} aria-label={`Remover ${item.nome}`} className="text-muted hover:text-danger">
                    <span className="mdi mdi-close-circle text-[18px]" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-baseline justify-end gap-3 border-t border-border px-5 py-3 text-[13px]">
              <span className="text-muted">Total</span>
              <span className="font-mono text-[16px] font-semibold tabular-nums">{money(total)}</span>
            </div>
          </div>
        ) : (
          <p className="mb-8 text-[13px] text-muted">Busque um produto acima para adicionar o primeiro item.</p>
        )}

        <label className="mb-8 block">
          <span className="field-label">Observações (opcional)</span>
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="input h-auto py-2" />
        </label>

        {saveError && (
          <p className="mb-4 text-[13px] text-danger" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex justify-end border-t border-border pt-5">
          <button type="submit" disabled={!isValid || isSaving} className="btn btn-primary">
            {isSaving ? 'Salvando...' : 'Criar pedido'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default PedidoFormPage;
