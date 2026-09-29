import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../store/slices/inventorySlice';
import apiService from '../services/api';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const CatalogPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading, error } = useSelector((state) => state.inventory);
  const [expanded, setExpanded] = useState({});

  const [marcas, setMarcas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [loadingEstrutura, setLoadingEstrutura] = useState(true);
  const [erroEstrutura, setErroEstrutura] = useState(null);

  const [modal, setModal] = useState(null); // { tipo: 'marca' | 'linha', marcaId? }
  const [form, setForm] = useState({ nome: '', descricao: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);

  const carregarEstrutura = () => {
    setLoadingEstrutura(true);
    Promise.all([apiService.getMarcas(), apiService.getLinhas()])
      .then(([marcasRes, linhasRes]) => {
        setMarcas(marcasRes);
        setLinhas(linhasRes);
        setErroEstrutura(null);
      })
      .catch(setErroEstrutura)
      .finally(() => setLoadingEstrutura(false));
  };

  useEffect(() => {
    dispatch(fetchProducts());
    carregarEstrutura();
  }, [dispatch]);

  const catalogo = useMemo(() => {
    const produtosPorLinha = new Map();
    for (const produto of products) {
      const linhaId = produto.linha?.id;
      if (!produtosPorLinha.has(linhaId)) produtosPorLinha.set(linhaId, []);
      produtosPorLinha.get(linhaId).push(produto);
    }

    return marcas
      .map((marca) => {
        const linhasDaMarca = linhas
          .filter((l) => l.marca?.id === marca.id)
          .map((linha) => ({
            ...linha,
            produtos: (produtosPorLinha.get(linha.id) || []).sort((a, b) => a.nome.localeCompare(b.nome)),
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome));
        const totalProdutos = linhasDaMarca.reduce((sum, l) => sum + l.produtos.length, 0);
        return { ...marca, linhasDaMarca, totalProdutos };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [marcas, linhas, products]);

  const toggleMarca = (marcaId) => setExpanded((prev) => ({ ...prev, [marcaId]: !prev[marcaId] }));

  const abrirModalMarca = () => {
    setForm({ nome: '', descricao: '' });
    setErroSalvar(null);
    setModal({ tipo: 'marca' });
  };
  const abrirModalLinha = (marcaId) => {
    setForm({ nome: '', descricao: '' });
    setErroSalvar(null);
    setModal({ tipo: 'linha', marcaId });
  };
  const fecharModal = () => setModal(null);

  const handleExcluirMarca = async (marca) => {
    if (!window.confirm(`Excluir a marca "${marca.nome}"? Linhas e produtos associados também serão removidos ou arquivados, caso já tenham histórico de movimentação ou pedido.`)) {
      return;
    }
    setExcluindoId(marca.id);
    try {
      await apiService.deleteMarca(marca.id);
      carregarEstrutura();
      dispatch(fetchProducts());
    } catch (err) {
      window.alert(err?.message || 'Erro ao excluir marca');
    } finally {
      setExcluindoId(null);
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      if (modal.tipo === 'marca') {
        await apiService.createMarca({ nome: form.nome, descricao: form.descricao });
      } else {
        await apiService.createLinha({ nome: form.nome, descricao: form.descricao, marca: { id: modal.marcaId } });
        setExpanded((prev) => ({ ...prev, [modal.marcaId]: true }));
      }
      carregarEstrutura();
      setModal(null);
    } catch (err) {
      setErroSalvar(err?.message || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="p-5 md:p-9">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Catálogo / 01</p>
          <h2 className="font-display mt-3 text-[34px] tracking-[-0.03em] md:text-[40px]">Catálogo por marca.</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={abrirModalMarca}
            className="rounded-full border border-border px-4 py-2.5 text-[12px] text-muted hover:bg-brand-bg"
          >
            <span className="mdi mdi-tag-plus-outline mr-1" /> Nova marca
          </button>
          <Link
            to="/produtos/novo"
            className="pressable flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark"
          >
            <span className="mdi mdi-plus text-[15px]" /> Novo produto
          </Link>
        </div>
      </div>

      {(isLoading || loadingEstrutura) ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
          <p className="mt-4 text-[12px] text-muted-light">Carregando catálogo...</p>
        </div>
      ) : error || erroEstrutura ? (
        <p className="text-[13px] text-danger">
          Erro ao carregar catálogo: {(error || erroEstrutura).message || String(error || erroEstrutura)}
        </p>
      ) : catalogo.length === 0 ? (
        <p className="text-[13px] text-muted-light">Nenhuma marca cadastrada ainda.</p>
      ) : (
        <div className="space-y-4">
          {catalogo.map((marca) => {
            const isOpen = expanded[marca.id] !== false; // default open
            return (
              <section key={marca.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="flex items-center justify-between gap-3 p-5">
                  <button onClick={() => toggleMarca(marca.id)} className="flex flex-1 items-center gap-3 text-left">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-50 font-display text-[14px] text-[#2d2724]">
                      {marca.nome.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-display text-[22px]">{marca.nome}</h3>
                      <p className="text-[11px] text-muted-light">
                        {marca.linhasDaMarca.length} {marca.linhasDaMarca.length === 1 ? 'linha' : 'linhas'} ·{' '}
                        {marca.totalProdutos} {marca.totalProdutos === 1 ? 'produto' : 'produtos'}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => abrirModalLinha(marca.id)}
                    className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted hover:bg-brand-bg"
                  >
                    <span className="mdi mdi-plus mr-1" /> Linha
                  </button>
                  <button
                    onClick={() => handleExcluirMarca(marca)}
                    disabled={excluindoId === marca.id}
                    className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
                  >
                    {excluindoId === marca.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                  <button onClick={() => toggleMarca(marca.id)} aria-label="Expandir">
                    <span className={`mdi mdi-chevron-down text-[20px] text-muted transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-border">
                    {marca.linhasDaMarca.length === 0 ? (
                      <p className="px-5 py-6 text-[12px] text-muted-light">
                        Nenhuma linha cadastrada para esta marca ainda.
                      </p>
                    ) : (
                      marca.linhasDaMarca.map((linha) => (
                        <div key={linha.id} className="border-b border-border px-5 py-4 last:border-0">
                          <p className="eyebrow mb-3">{linha.nome}</p>
                          {linha.produtos.length === 0 ? (
                            <p className="text-[12px] text-muted-light">Nenhum produto nesta linha ainda.</p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {linha.produtos.map((produto) => (
                                <Link
                                  key={produto.id}
                                  to={`/produtos/${produto.id}`}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-brand-bg px-3 py-2.5 text-[12px] hover:border-secondary-dark"
                                >
                                  <span className="truncate">{produto.nome}</span>
                                  <span className="shrink-0 font-mono text-[11px] text-muted-light tabular-nums">
                                    {money(produto.precoVenda)}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="w-full max-w-[440px] rounded-t-2xl bg-surface p-6 shadow-[0_30px_80px_rgba(45,39,36,0.25)] sm:rounded-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="eyebrow">{modal.tipo === 'marca' ? 'Nova marca' : 'Nova linha'}</p>
                <h2 className="font-display mt-2 text-[24px]">
                  {modal.tipo === 'marca' ? 'Cadastrar marca.' : 'Cadastrar linha.'}
                </h2>
              </div>
              <button onClick={fecharModal} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted">
                <span className="mdi mdi-close text-[16px]" />
              </button>
            </div>
            <form onSubmit={salvar} className="grid gap-4">
              <label className="grid gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Nome</span>
                <input
                  autoFocus
                  value={form.nome}
                  onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder={modal.tipo === 'marca' ? 'Ex: Eudora' : 'Ex: Glamour'}
                  className="h-10 w-full rounded-lg border border-border bg-brand-bg px-3 text-[12px] outline-none focus:border-secondary-dark"
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Descrição (opcional)</span>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-brand-bg px-3 text-[12px] outline-none focus:border-secondary-dark"
                />
              </label>
              {erroSalvar && <p className="text-[12px] text-danger">{String(erroSalvar)}</p>}
              <div className="mt-2 flex justify-end gap-3 border-t border-border pt-5">
                <button type="button" onClick={fecharModal} className="rounded-full border border-border px-5 py-2.5 text-[12px] text-muted">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || !form.nome.trim()}
                  className="pressable rounded-full bg-primary px-5 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default CatalogPage;
