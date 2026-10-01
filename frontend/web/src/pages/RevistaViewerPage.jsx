import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiService from '../services/api';
import RevistaImagem from '../components/RevistaImagem';

// One magazine, one page at a time. Arrow keys, the buttons or the slider turn pages.
const RevistaViewerPage = () => {
  const { id } = useParams();
  const [revista, setRevista] = useState(null);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    setPagina(1);
    apiService
      .getRevistas()
      .then((list) => {
        const found = list.find((r) => String(r.id) === id);
        if (found) setRevista(found);
        else setError('Revista não encontrada');
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const total = revista?.totalPaginas || 1;
  const go = (n) => setPagina((p) => Math.min(total, Math.max(1, typeof n === 'function' ? n(p) : n)));

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') go((p) => p + 1);
      if (e.key === 'ArrowLeft') go((p) => p - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Warm the cache for the next page so turning it feels instant.
  useEffect(() => {
    if (revista && pagina < total) apiService.getRevistaImagem(`${id}/paginas/${pagina + 1}`).catch(() => {});
  }, [revista, pagina, total, id]);

  if (error) {
    return (
      <main className="p-5 md:p-9">
        <p className="text-[13px] text-danger">{error}</p>
        <Link to="/revistas" className="mt-4 inline-block text-[12px] font-medium text-secondary-dark">
          Voltar às revistas
        </Link>
      </main>
    );
  }

  const navButton = 'pressable grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-ink transition hover:bg-brand-bg disabled:opacity-40';

  return (
    <main className="mx-auto max-w-[900px] p-5 md:p-9">
      <Link to="/revistas" className="inline-flex items-center gap-1 text-[12px] font-medium text-secondary-dark hover:text-primary">
        <span className="mdi mdi-chevron-left text-[16px]" /> Revistas
      </Link>
      <div className="mt-3 mb-6">
        <h2 className="font-display text-[28px] tracking-[-0.02em] md:text-[34px]">{revista?.titulo || '...'}</h2>
        {revista && <p className="mt-1 text-[12px] text-muted-light">{revista.marcaNome}</p>}
      </div>

      {revista && (
        <>
          <RevistaImagem
            path={`${id}/paginas/${pagina}`}
            alt={`${revista.titulo}, página ${pagina}`}
            className="mx-auto block max-h-[calc(100vh-250px)] min-h-[300px] min-w-[240px] max-w-full rounded-xl border border-border bg-surface object-contain shadow-[0_12px_35px_rgba(63,47,35,0.08)]"
          />

          <div className="sticky bottom-0 mt-5 flex items-center gap-3 bg-brand-bg/90 py-3 backdrop-blur">
            <button className={navButton} disabled={pagina <= 1} onClick={() => go((p) => p - 1)} aria-label="Página anterior">
              <span className="mdi mdi-chevron-left text-[20px]" />
            </button>
            <input
              type="range"
              min={1}
              max={total}
              value={pagina}
              onChange={(e) => go(Number(e.target.value))}
              aria-label="Ir para a página"
              className="flex-1 accent-primary"
            />
            <span className="w-[84px] text-center font-mono text-[11px] tabular-nums text-muted">
              {pagina} / {total}
            </span>
            <button className={navButton} disabled={pagina >= total} onClick={() => go((p) => p + 1)} aria-label="Próxima página">
              <span className="mdi mdi-chevron-right text-[20px]" />
            </button>
          </div>
        </>
      )}
    </main>
  );
};

export default RevistaViewerPage;
