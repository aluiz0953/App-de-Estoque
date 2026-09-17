import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createPedido } from '../store/slices/pedidosSlice';
import apiService from '../services/api';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

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

  return (
    <main className="p-5 md:p-9">
      <button onClick={() => navigate(-1)} className="eyebrow mb-3 flex items-center gap-1 hover:text-secondary-dark">
        <span className="mdi mdi-arrow-left" /> Voltar
      </button>
      <h2 className="font-display mb-8 text-[34px] tracking-[-0.03em] md:text-[40px]">Novo pedido.</h2>

      <form onSubmit={handleSubmit} className="max-w-3xl rounded-xl border border-border bg-surface p-6 md:p-8">
        <h3 className="font-display mb-4 text-[20px]">Cliente</h3>
        {selectedCliente ? (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-secondary-dark bg-brand-bg px-4 py-3">
            <div>
              <p className="text-[13px] font-medium">{selectedCliente.nome}</p>
              <p className="text-[11px] text-muted-light">{selectedCliente.telefone || selectedCliente.email}</p>
            </div>
            <button type="button" onClick={() => setSelectedCliente(null)} className="text-muted hover:text-danger">
              <span className="mdi mdi-close-circle" />
            </button>
          </div>
        ) : showNewCliente ? (
          <div className="mb-6 grid gap-3 rounded-lg border border-border bg-brand-bg p-4 sm:grid-cols-3">
            <input
              value={newCliente.nome}
              onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })}
              placeholder="Nome"
              className="h-10 rounded-lg border border-border bg-surface px-3 text-[12px] outline-none focus:border-secondary-dark"
            />
            <input
              value={newCliente.telefone}
              onChange={(e) => setNewCliente({ ...newCliente, telefone: e.target.value })}
              placeholder="Telefone"
              className="h-10 rounded-lg border border-border bg-surface px-3 text-[12px] outline-none focus:border-secondary-dark"
            />
            <input
              value={newCliente.email}
              onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
              placeholder="E-mail"
              className="h-10 rounded-lg border border-border bg-surface px-3 text-[12px] outline-none focus:border-secondary-dark"
            />
            <button
              type="button"
              onClick={() => setShowNewCliente(false)}
              className="text-[11px] text-muted underline decoration-border underline-offset-4 sm:col-span-3 sm:w-fit"
            >
              Buscar cliente existente
            </button>
          </div>
        ) : (
          <div className="relative mb-6">
            <input
              value={clienteSearch}
              onChange={(e) => setClienteSearch(e.target.value)}
              placeholder="Buscar cliente por nome..."
              className="h-10 w-full max-w-sm rounded-lg border border-border bg-brand-bg px-3 text-[12px] outline-none focus:border-secondary-dark"
            />
            <button
              type="button"
              onClick={() => setShowNewCliente(true)}
              className="ml-3 text-[11px] text-secondary-dark hover:text-primary"
            >
              + Novo cliente
            </button>
            {clienteResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-w-sm rounded-lg border border-border bg-surface shadow-lg">
                {clienteResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setSelectedCliente(c); setClienteResults([]); setClienteSearch(''); }}
                    className="block w-full truncate border-b border-border px-3 py-2 text-left text-[12px] last:border-0 hover:bg-brand-bg"
                  >
                    {c.nome} {c.telefone ? `· ${c.telefone}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <h3 className="font-display mb-4 text-[20px]">Itens</h3>
        <div className="relative mb-4">
          <input
            value={produtoSearch}
            onChange={(e) => setProdutoSearch(e.target.value)}
            placeholder="Buscar produto por nome ou SKU..."
            className="h-10 w-full rounded-lg border border-border bg-brand-bg px-3 text-[12px] outline-none focus:border-secondary-dark"
          />
          {produtoResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
              {produtoResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addItem(p)}
                  className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-[12px] last:border-0 hover:bg-brand-bg"
                >
                  <span className="truncate">{p.nome} · {p.sku}</span>
                  <span className="tabular-nums text-muted-light">{money(p.precoVenda)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {itens.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-lg border border-border">
            {itens.map((item) => (
              <div key={item.produtoId} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-[12px] last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.nome}</p>
                  <p className="text-[10px] text-muted-light">{item.sku} · {money(item.precoVenda)}/un.</p>
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => updateQuantidade(item.produtoId, e.target.value)}
                  className="h-9 w-16 rounded-lg border border-border bg-brand-bg px-2 text-center outline-none focus:border-secondary-dark"
                />
                <span className="w-20 text-right tabular-nums">{money(item.precoVenda * item.quantidade)}</span>
                <button type="button" onClick={() => removeItem(item.produtoId)} className="text-muted hover:text-danger">
                  <span className="mdi mdi-close-circle" />
                </button>
              </div>
            ))}
            <div className="flex justify-end bg-brand-bg px-4 py-3 text-[13px] font-medium">
              Total: <span className="ml-2 tabular-nums">{money(total)}</span>
            </div>
          </div>
        )}

        <label className="mb-6 grid gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Observações (opcional)</span>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            className="rounded-lg border border-border bg-brand-bg px-3 py-2 text-[12px] outline-none focus:border-secondary-dark"
          />
        </label>

        {saveError && <p className="mb-4 text-[12px] text-danger">{saveError}</p>}

        <div className="flex justify-end border-t border-border pt-5">
          <button
            type="submit"
            disabled={!isValid || isSaving}
            className="pressable rounded-full bg-primary px-6 py-3 text-[12px] text-primary-50 transition hover:bg-primary-dark disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Criar pedido'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default PedidoFormPage;
