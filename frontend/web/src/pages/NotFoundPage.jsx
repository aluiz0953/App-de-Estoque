import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FluidOrb from '../components/FluidOrb';
import { prefersReducedMotion } from '../utils/performance';

// Any address inside the app that no page answers to. The "0" of 404 is the animated orb
// (a still frame when the person asked for less motion).
const NotFoundPage = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const canGoBack = (window.history.state?.idx ?? 0) > 0;
  const [still] = useState(prefersReducedMotion);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Página não encontrada · Estoque';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-12 text-center">
      <p className="eyebrow">Erro 404</p>

      <p aria-hidden="true" className="font-display mt-4 flex items-center gap-2 text-[8rem] leading-none tracking-[-0.04em] text-ink">
        <span>4</span>
        {still ? <span>0</span> : <span className="translate-y-[0.2em]"><FluidOrb size={92} color="#dd6383" /></span>}
        <span>4</span>
      </p>

      <h1 className="font-display mt-6 text-[28px] tracking-[-0.02em] text-ink">Essa página não está na prateleira</h1>
      <p className="mt-2 max-w-sm text-[13px] text-muted">
        O endereço não existe ou foi movido. Confira se ele está certo ou volte para o painel.
      </p>
      <p className="mt-4 max-w-full break-all rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted-light">
        {pathname}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="pressable rounded-full bg-primary px-5 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark"
        >
          Voltar ao painel
        </Link>
        <Link
          to="/estoque"
          className="pressable rounded-full border border-border px-5 py-2.5 text-[12px] text-ink transition hover:bg-black/5 dark:hover:bg-white/5"
        >
          Ver estoque
        </Link>
        {canGoBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="pressable px-3 py-2.5 text-[12px] font-medium text-secondary-dark hover:text-primary"
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;
