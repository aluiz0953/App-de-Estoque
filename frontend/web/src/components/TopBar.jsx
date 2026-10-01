import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// The Figma dashboard's top bar: product search, notifications and "Novo produto".
// Desktop only - on small screens the Sidebar's own header is the top bar.
const TopBar = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.user?.role);
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const busca = query.trim();
    navigate(busca ? `/estoque?busca=${encodeURIComponent(busca)}` : '/estoque');
  };

  return (
    <header className="sticky top-0 z-10 hidden h-[76px] items-center gap-3 border-b border-border bg-surface/90 px-9 backdrop-blur lg:flex">
      <form onSubmit={handleSearch} role="search" className="flex h-10 w-[min(440px,52vw)] items-center gap-2.5 rounded-[11px] border border-border bg-brand-bg px-3 text-muted-light focus-within:border-primary/50 focus-within:bg-surface focus-within:ring-[3px] focus-within:ring-primary/10">
        <span className="mdi mdi-magnify text-[18px]" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto, marca ou SKU..."
          aria-label="Buscar produto, marca ou SKU"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted-light"
        />
      </form>
      <Link
        to="/notificacoes"
        aria-label="Notificações"
        className="relative ml-auto grid h-10 w-10 place-items-center rounded-[11px] border border-border bg-surface text-muted transition hover:text-ink"
      >
        <span className="mdi mdi-bell-outline text-[18px]" aria-hidden="true" />
      </Link>
      {(role === 'ADMIN' || role === 'MANAGER') && (
        <Link
          to="/produtos/novo"
          className="pressable inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-[12px] font-bold text-primary-50 shadow-[0_5px_14px_rgba(35,158,75,0.2)] transition hover:bg-primary-dark"
        >
          <span className="mdi mdi-plus text-[16px]" aria-hidden="true" /> Novo produto
        </Link>
      )}
    </header>
  );
};

export default TopBar;
