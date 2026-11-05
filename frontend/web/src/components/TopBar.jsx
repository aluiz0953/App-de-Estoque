import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Desktop top bar: find a product (press "/" anywhere), notifications, and the primary action.
// On small screens the Sidebar's own header is the top bar.
const TopBar = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.user?.role);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const busca = query.trim();
    navigate(busca ? `/estoque?busca=${encodeURIComponent(busca)}` : '/estoque');
  };

  return (
    <header className="sticky top-0 z-10 hidden h-14 items-center gap-3 border-b border-border bg-brand-bg px-9 lg:flex">
      <form
        onSubmit={handleSearch}
        role="search"
        className="flex h-9 w-[min(420px,48vw)] items-center gap-2.5 rounded-md border border-border bg-surface px-3 text-muted-light transition-colors duration-150 focus-within:border-primary"
      >
        <span className="mdi mdi-magnify text-[18px]" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto, marca ou SKU"
          aria-label="Buscar produto, marca ou SKU"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted-light"
        />
        <kbd className="rounded border border-border px-1.5 font-mono text-[10px] text-muted-light" aria-hidden="true">/</kbd>
      </form>
      <Link
        to="/notificacoes"
        aria-label="Notificações"
        className="ml-auto grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-muted transition-colors duration-150 hover:text-ink"
      >
        <span className="mdi mdi-bell-outline text-[18px]" aria-hidden="true" />
      </Link>
      {(role === 'ADMIN' || role === 'MANAGER') && (
        <Link to="/produtos/novo" className="btn btn-primary">
          <span className="mdi mdi-plus text-[16px]" aria-hidden="true" /> Novo produto
        </Link>
      )}
    </header>
  );
};

export default TopBar;
