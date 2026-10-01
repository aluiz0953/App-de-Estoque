import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import RevistaImagem from '../components/RevistaImagem';

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
    <main className="p-5 md:p-9">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Revistas / 01</p>
          <h2 className="font-display mt-3 text-[34px] tracking-[-0.03em] md:text-[40px]">Revistas das marcas.</h2>
        </div>
        {canEdit && (
          <button
            onClick={openForm}
            className="pressable flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark"
          >
            <span className="mdi mdi-plus text-[15px]" /> Nova revista
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleUpload}
          className="mb-8 grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-[1fr_1.4fr_1.4fr_auto] md:items-end"
        >
          <label className="grid gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Marca</span>
            <select
              value={form.marcaId}
              onChange={(e) => setForm({ ...form, marcaId: e.target.value })}
              className="h-11 rounded-lg border border-border bg-brand-bg px-3 text-[13px] outline-none focus:border-secondary-dark"
            >
              <option value="">Selecione</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Nome da revista</span>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              maxLength={150}
              placeholder="Ex.: Ciclo 12 - 2026"
              className="h-11 rounded-lg border border-border bg-brand-bg px-3 text-[13px] outline-none placeholder:text-muted-light focus:border-secondary-dark"
            />
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Arquivo PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setForm({ ...form, arquivo: e.target.files[0] || null })}
              className="h-11 rounded-lg border border-border bg-brand-bg px-3 py-2.5 text-[12px]"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploadDisabled}
              className="pressable h-11 rounded-full bg-primary px-5 text-[12px] font-medium text-primary-50 transition hover:bg-primary-dark disabled:opacity-50"
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => setShowForm(false)}
              className="h-11 rounded-full border border-border px-4 text-[12px] text-muted disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
          {uploading && (
            <p className="text-[12px] text-muted-light md:col-span-4">
              Convertendo as páginas. Revistas grandes podem levar um minuto, não feche esta tela.
            </p>
          )}
          {uploadError && <p className="text-[12px] text-danger md:col-span-4">{uploadError}</p>}
        </form>
      )}

      {brandNames.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {['Todas', ...brandNames].map((nome) => (
            <button
              key={nome}
              onClick={() => setMarcaFilter(nome)}
              className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
                marcaFilter === nome ? 'bg-primary text-primary-50' : 'border border-border bg-surface text-muted hover:bg-brand-bg'
              }`}
            >
              {nome}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-4 text-[13px] text-danger">Erro: {error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-16 text-center">
          <span className="mdi mdi-book-open-page-variant-outline mx-auto mb-3 block text-[22px] text-secondary" />
          <p className="font-display text-[22px]">Nenhuma revista por aqui.</p>
          {canEdit && <p className="mt-1 text-[12px] text-muted-light">Envie o PDF de uma revista para começar.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
          {visible.map((revista) => (
            <div key={revista.id} className="group relative">
              <Link to={`/revistas/${revista.id}`} className="block">
                <RevistaImagem
                  path={`${revista.id}/capa`}
                  alt={`Capa de ${revista.titulo}`}
                  className="aspect-[3/4] w-full rounded-xl border border-border bg-surface object-cover shadow-[0_12px_35px_rgba(63,47,35,0.08)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_45px_rgba(63,47,35,0.14)]"
                />
                <p className="mt-3 text-[13px] font-medium">{revista.titulo}</p>
                <p className="mt-0.5 text-[11px] text-muted-light">
                  {revista.marcaNome} · {revista.totalPaginas} páginas
                </p>
              </Link>
              {canEdit && (
                <button
                  onClick={() => handleDelete(revista)}
                  aria-label={`Apagar ${revista.titulo}`}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-danger opacity-0 shadow transition focus:opacity-100 group-hover:opacity-100"
                >
                  <span className="mdi mdi-trash-can-outline text-[16px]" />
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
