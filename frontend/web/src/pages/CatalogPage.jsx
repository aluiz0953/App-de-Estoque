import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../store/slices/inventorySlice';
import apiService from '../services/api';
import PageHead from '../components/PageHead';
import { money } from '../utils/money';

const COLUMNS = 'grid-cols-[minmax(0,1fr)_96px] sm:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_96px]';

const CatalogPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading, error } = useSelector((state) => state.inventory);
  // marcas start closed (the catalogue is long); a line opens inside an open marca.
  const [openMarcas, setOpenMarcas] = useState({});
  const [openLinhas, setOpenLinhas] = useState({});

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

  const toggleMarca = (marcaId) => setOpenMarcas((prev) => ({ ...prev, [marcaId]: !prev[marcaId] }));
  const toggleLinha = (linhaId) => setOpenLinhas((prev) => ({ ...prev, [linhaId]: !prev[linhaId] }));

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
        setOpenMarcas((prev) => ({ ...prev, [modal.marcaId]: true }));
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
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <PageHead
        title="Produtos"
        meta={loadingEstrutura || isLoading ? 'Carregando catálogo…' : `${catalogo.length} ${catalogo.length === 1 ? 'marca' : 'marcas'} · ${products.length} produtos`}
      >
        <button onClick={abrirModalMarca} className="btn btn-quiet">
          <span className="mdi mdi-tag-plus-outline text-[16px]" aria-hidden="true" /> Nova marca
        </button>
        <Link to="/produtos/novo" className="btn btn-primary">
          <span className="mdi mdi-plus text-[16px]" aria-hidden="true" /> Novo produto
        </Link>
      </PageHead>

      {isLoading || loadingEstrutura ? (
        <p className="text-[13px] text-muted" aria-busy="true">
          Carregando catálogo…
        </p>
      ) : error || erroEstrutura ? (
        <p className="text-[13px] text-danger">Erro ao carregar catálogo: {(error || erroEstrutura).message || String(error || erroEstrutura)}</p>
      ) : catalogo.length === 0 ? (
        <div className="sheet px-5 py-10">
          <p className="text-[14px] font-medium">Nenhuma marca cadastrada ainda.</p>
          <p className="mt-1 text-[13px] text-muted">Comece cadastrando a primeira marca; as linhas e os produtos vêm dentro dela.</p>
          <button onClick={abrirModalMarca} className="btn btn-quiet mt-4">
            Nova marca
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {catalogo.map((marca) => {
            const isOpen = !!openMarcas[marca.id];
            return (
              <section key={marca.id} className="sheet overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={() => toggleMarca(marca.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className={`mdi mdi-chevron-right text-[20px] text-muted transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold">{marca.nome}</span>
                      <span className="block text-[12px] text-muted">
                        {marca.linhasDaMarca.length} {marca.linhasDaMarca.length === 1 ? 'linha' : 'linhas'} · {marca.totalProdutos}{' '}
                        {marca.totalProdutos === 1 ? 'produto' : 'produtos'}
                      </span>
                    </span>
                  </button>
                  <button onClick={() => abrirModalLinha(marca.id)} className="btn btn-quiet h-8 px-3 text-[12px]">
                    <span className="mdi mdi-plus" aria-hidden="true" /> Linha
                  </button>
                  {/* Excluir sits apart from the everyday action: space and a rule, never next to it. */}
                  <button
                    onClick={() => handleExcluirMarca(marca)}
                    disabled={excluindoId === marca.id}
                    className="btn btn-danger ml-4 h-8 border-l border-border pl-3 text-[12px]"
                  >
                    {excluindoId === marca.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-border">
                    {marca.linhasDaMarca.length === 0 ? (
                      <p className="px-5 py-5 text-[13px] text-muted">Nenhuma linha cadastrada para esta marca ainda.</p>
                    ) : (
                      marca.linhasDaMarca.map((linha) => {
                        const linhaOpen = !!openLinhas[linha.id];
                        return (
                          <div key={linha.id} className="border-b border-border last:border-0">
                            <button
                              onClick={() => toggleLinha(linha.id)}
                              aria-expanded={linhaOpen}
                              className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-[13px] hover:bg-brand-bg"
                            >
                              <span className={`mdi mdi-chevron-right text-[18px] text-muted-light transition-transform duration-150 motion-reduce:transition-none ${linhaOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                              <span className="font-medium">{linha.nome}</span>
                              <span className="font-mono text-[12px] text-muted">{linha.produtos.length}</span>
                            </button>
                            {linhaOpen &&
                              (linha.produtos.length === 0 ? (
                                <p className="px-5 pb-4 pl-[52px] text-[13px] text-muted">Nenhum produto nesta linha ainda.</p>
                              ) : (
                                <div className="listing-body border-t border-border">
                                  {linha.produtos.map((produto) => (
                                    <Link key={produto.id} to={`/produtos/${produto.id}`} className={`listing-row pl-[52px] ${COLUMNS}`}>
                                      <span className="truncate">{produto.nome}</span>
                                      <span className="hidden truncate font-mono text-[12px] text-muted sm:block">{produto.sku}</span>
                                      <span className="text-right font-mono tabular-nums">{money(produto.precoVenda)}</span>
                                    </Link>
                                  ))}
                                </div>
                              ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
          <div className="w-full max-w-[440px] rounded-t-lg border border-border bg-surface p-6 shadow-[0_24px_60px_-20px_rgba(23,32,27,0.4)] sm:rounded-lg">
            <div className="mb-5 flex items-start justify-between">
              <h2 id="modal-titulo" className="text-[17px] font-semibold">
                {modal.tipo === 'marca' ? 'Cadastrar marca' : 'Cadastrar linha'}
              </h2>
              <button onClick={fecharModal} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-brand-bg hover:text-ink">
                <span className="mdi mdi-close text-[18px]" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={salvar} className="grid gap-4">
              <label className="block">
                <span className="field-label">Nome</span>
                <input
                  autoFocus
                  value={form.nome}
                  onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder={modal.tipo === 'marca' ? 'Ex: Eudora' : 'Ex: Glamour'}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="field-label">Descrição (opcional)</span>
                <input value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} className="input" />
              </label>
              {erroSalvar && (
                <p className="text-[13px] text-danger" role="alert">
                  {String(erroSalvar)}
                </p>
              )}
              <div className="mt-2 flex justify-end gap-3 border-t border-border pt-5">
                <button type="button" onClick={fecharModal} className="btn btn-quiet">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando || !form.nome.trim()} className="btn btn-primary">
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
