import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Any address inside the app that no page answers to.
const NotFoundPage = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const canGoBack = (window.history.state?.idx ?? 0) > 0;

  useEffect(() => {
    const previous = document.title;
    document.title = 'Página não encontrada · Estoque';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="mx-auto max-w-[640px] px-5 py-16 md:px-9">
      <span className="stamp stamp-off">Erro 404</span>
      <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.01em]">Essa página não está na prateleira</h1>
      <p className="mt-2 max-w-[52ch] text-[13px] text-muted">O endereço não existe ou foi movido. Confira se ele está certo ou volte para o painel.</p>
      <p className="mt-4 max-w-full break-all rounded-md border border-border bg-surface px-3 py-2 font-mono text-[12px] text-muted">{pathname}</p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link to="/" className="btn btn-primary">
          Voltar ao painel
        </Link>
        <Link to="/estoque" className="btn btn-quiet">
          Ver estoque
        </Link>
        {canGoBack && (
          <button type="button" onClick={() => navigate(-1)} className="px-2 text-[13px] font-medium text-muted hover:text-ink">
            Voltar
          </button>
        )}
      </div>
    </main>
  );
};

export default NotFoundPage;
