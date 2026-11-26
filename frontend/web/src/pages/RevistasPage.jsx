import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import RevistaImagem from '../components/RevistaImagem';
import PageHead from '../components/PageHead';

const emptyForm = { marcaId: '', titulo: '', arquivo: null };

const RevistasPage = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const canEdit = role === 'ADMIN' || role === 'MANAGER';

  const [revistas, setRevistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marcaFilter, setMarcaFilter] = useState('Todas');

  const [showForm, setShowForm] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const load = useCallback(() => {
    return apiService
      .getRevistas()
      .then((data) => {
        setRevistas(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = () => {
    setShowForm(true);
    if (!marcas.length) apiService.getMarcas().then(setMarcas).catch(() => setMarcas([]));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    try {
      await apiService.uploadRevista(form);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (revista) => {
    if (!window.confirm(`Apagar a revista "${revista.titulo}"?`)) return;
    try {
      await apiService.deleteRevista(revista.id);
      setRevistas((list) => list.filter((r) => r.id !== revista.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const brandNames = useMemo(() => [...new Set(revistas.map((r) => r.marcaNome))], [revistas]);
  const visible = marcaFilter === 'Todas' ? revistas : revistas.filter((r) => r.marcaNome === marcaFilter);
  const uploadDisabled = uploading || !form.marcaId || !form.titulo.trim() || !form.arquivo;

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <PageHead title="Revistas" meta={loading ? 'Carregando…' : `${revistas.length} ${revistas.length === 1 ? 'revista' : 'revistas'}`}>
        {canEdit && (
          <button onClick={openForm} className="btn btn-primary">
            <span className="mdi mdi-plus text-[16px]" aria-hidden="true" /> Nova revista
          </button>
        )}
      </PageHead>

      {showForm && (
        <form onSubmit={handleUpload} className="sheet mb-8 grid gap-4 p-5 md:grid-cols-[1fr_1.4fr_1.4fr] md:items-end">
          <label className="block">
            <span className="field-label">Marca</span>
            <span className="field-control block">
              <select value={form.marcaId} onChange={(e) => setForm({ ...form, marcaId: e.target.value })}>
                <option value="">Selecione</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="block">
            <span className="field-label">Nome da revista</span>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} maxLength={150} placeholder="Ex.: Ciclo 12 - 2026" className="input" />
          </label>
          <label className="block">
            <span className="field-label">Arquivo PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setForm({ ...form, arquivo: e.target.files[0] || null })}
              className="input h-10 py-1.5 text-[12px] file:mr-3 file:rounded file:border-0 file:bg-band file:px-2.5 file:py-1 file:text-[12px] file:font-medium file:text-ink"
            />
          </label>
          {uploading && (
            <p className="text-[13px] text-muted md:col-span-3" role="status">
              Convertendo as páginas. Revistas grandes podem levar um minuto; não feche esta tela.
            </p>
          )}
          {uploadError && (
            <p className="text-[13px] text-danger md:col-span-3" role="alert">
              {uploadError}
            </p>
          )}
          <div className="flex gap-2 md:col-span-3">
            <button type="submit" disabled={uploadDisabled} className="btn btn-primary">
              {uploading ? 'Enviando...' : 'Enviar'}
            </button>
            <button type="button" disabled={uploading} onClick={() => setShowForm(false)} className="btn btn-quiet">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {brandNames.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-x-5 border-b border-border" role="tablist" aria-label="Marca">
          {['Todas', ...brandNames].map((nome) => (
            <button
              key={nome}
              role="tab"
              aria-selected={marcaFilter === nome}
              onClick={() => setMarcaFilter(nome)}
              className={`tab-link ${marcaFilter === nome ? 'tab-link-active' : ''}`}
            >
              {nome}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-4 text-[13px] text-danger">Erro: {error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-md bg-black/5" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="sheet px-5 py-12">
          <p className="text-[14px] font-medium">Nenhuma revista por aqui.</p>
          <p className="mt-1 max-w-[60ch] text-[13px] text-muted">
            {canEdit ? 'Envie o PDF de uma revista; cada página vira uma imagem que abre aqui e no app.' : 'Quem administra o catálogo envia as revistas das marcas.'}
          </p>
        </div>
      ) : (
        /* The cover in focus lifts and tells what it is; the rest of the shelf steps back. */
        <div className="group/shelf grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
          {visible.map((revista) => (
            <div
              key={revista.id}
              className="group relative transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:scale-[1.03] focus-within:-translate-y-1 focus-within:scale-[1.03] group-hover/shelf:opacity-50 group-focus-within/shelf:opacity-50 hover:!opacity-100 focus-within:!opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <Link to={`/revistas/${revista.id}`} className="block">
                <RevistaImagem
                  path={`${revista.id}/capa`}
                  alt={`Capa de ${revista.titulo}`}
                  className="aspect-[3/4] w-full rounded-md border border-border bg-surface object-cover"
                />
                <p className="mt-3 text-[13px] font-medium">{revista.titulo}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {revista.marcaNome} · <span className="font-mono">{revista.totalPaginas}</span> páginas
                </p>
              </Link>
              {canEdit && (
                <button
                  onClick={() => handleDelete(revista)}
                  aria-label={`Apagar ${revista.titulo}`}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-surface/95 text-danger opacity-0 shadow-[0_2px_8px_-2px_rgba(23,32,27,0.3)] transition-opacity focus:opacity-100 group-hover:opacity-100"
                >
                  <span className="mdi mdi-trash-can-outline text-[16px]" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default RevistasPage;
