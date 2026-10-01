import React, { useEffect, useState } from 'react';
import apiService from '../services/api';

// A page/cover image, fetched through the API (session cookie) and cached by path.
// `path` is relative to /revistas, e.g. "12/capa" or "12/paginas/3".
const RevistaImagem = ({ path, alt, className = '' }) => {
  const [state, setState] = useState({ path: null, src: null, failed: false });

  useEffect(() => {
    let cancelled = false;
    apiService
      .getRevistaImagem(path)
      .then((src) => !cancelled && setState({ path, src, failed: false }))
      .catch(() => !cancelled && setState({ path, src: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [path]);

  // While a new path loads, keep the previous page visible instead of flashing a skeleton.
  if (state.failed && state.path === path) {
    return (
      <div className={`grid place-items-center bg-brand-bg text-[12px] text-muted-light ${className}`}>
        Não foi possível carregar
      </div>
    );
  }
  if (!state.src) return <div className={`animate-pulse bg-black/5 ${className}`} aria-busy="true" />;
  return <img src={state.src} alt={alt} className={className} draggable={false} />;
};

export default RevistaImagem;
