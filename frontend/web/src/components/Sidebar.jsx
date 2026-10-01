import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, logoutUser } from '../store/slices/authSlice';

const ICONS = {
  home: 'view-dashboard-outline',
  'package-variant': 'archive-outline',
  package: 'package-variant-closed',
  'delivery-truck': 'truck-outline',
  copyright: 'tag-outline',
  'format-list-bulleted': 'format-list-bulleted',
  bell: 'bell-outline',
  'chart-bar': 'chart-bar',
  'account-multiple': 'account-multiple-outline',
};

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const isAuthenticated = !!user;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (e) {
      // backend session may already be gone (expired/invalid) - clear local state
      // ourselves so a stale `user` doesn't keep RequireAuth thinking we're signed in.
      dispatch(logoutUser());
    }
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { name: 'Dashboard', icon: 'home', to: '/', auth: true },
    { name: 'Estoque', icon: 'package-variant', to: '/estoque', auth: true },
    { name: 'Pedidos', icon: 'format-list-bulleted', to: '/pedidos', auth: ['ADMIN', 'MANAGER', 'OPERATOR'] },
    { name: 'Revistas', icon: 'book-open-page-variant-outline', to: '/revistas', auth: true },
    { name: 'Produtos', icon: 'package', to: '/produtos', auth: ['ADMIN', 'MANAGER'] },
    { name: 'Notificações', icon: 'bell', to: '/notificacoes', auth: ['ADMIN', 'MANAGER', 'AUDITOR'] },
    { name: 'Relatórios', icon: 'chart-bar', to: '/relatorios', auth: ['ADMIN', 'MANAGER'] },
    { name: 'Usuários', icon: 'account-multiple', to: '/usuarios', auth: ['ADMIN'] },
  ].filter((item) => {
    if (!isAuthenticated) return false;
    if (!item.auth) return true;
    if (Array.isArray(item.auth)) return item.auth.includes(user.role);
    return true;
  });

  if (!isAuthenticated) return null;

  const nav = (
    <>
      <div className="flex h-[86px] items-center gap-3 border-b border-border px-5">
        <img src="/logo-tico-e-tica.png" alt="Tico e Tica" className="h-10 w-auto" />
        <div className="leading-none">
          <p className="font-display text-[19px] text-ink">
            Tico <span className="italic text-secondary-dark">e</span> Tica
          </p>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-light">Perfumaria</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <p className="px-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-light">Menu</p>
        <nav className="mt-4 space-y-1">
          {menuItems.map((item) => {
            // "/" and "/dashboard" are the same page; sub-routes (/pedidos/12) keep their tab lit.
            const active =
              location.pathname === item.to ||
              (item.to === '/' ? location.pathname === '/dashboard' : location.pathname.startsWith(`${item.to}/`));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] transition ${
                  active ? 'bg-primary/10 font-medium text-primary-dark dark:text-primary' : 'text-muted hover:bg-brand-bg hover:text-ink'
                }`}
              >
                <span className={`mdi mdi-${ICONS[item.icon] || item.icon} text-[17px]`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-border p-5">
        <div className="flex items-center gap-3 rounded-lg bg-brand-bg p-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary font-display text-[14px] text-white">
            {(user.user || user.username || user.nome || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">{user.user || user.username || user.nome}</p>
            <p className="truncate text-[10px] text-muted-light">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-[12px] text-muted transition hover:bg-brand-bg hover:text-ink"
        >
          <span className="mdi mdi-logout text-[14px]" />
          Sair da conta
        </button>
      </div>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo-tico-e-tica.png" alt="Tico e Tica" className="h-8 w-auto" />
          <span className="font-display text-[17px] text-ink">
            Tico <span className="italic text-secondary-dark">e</span> Tica
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-ink"
          aria-label="Abrir menu"
        >
          <span className="mdi mdi-menu text-[18px]" />
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col border-r border-border bg-surface lg:flex">
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-[238px] flex-col bg-surface">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted hover:text-ink"
              aria-label="Fechar menu"
            >
              <span className="mdi mdi-close text-[16px]" />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
