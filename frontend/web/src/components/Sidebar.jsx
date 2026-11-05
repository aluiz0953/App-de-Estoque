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

// The rail is a row of index tabs. Collapsed it shows icons (64px); hover or keyboard focus opens it to
// 232px over the page, never pushing the content. The open tab is filled and attached to the page edge.
const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';
const REVEAL =
  'opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100 group-hover/rail:delay-75 group-focus-within/rail:opacity-100 motion-reduce:transition-none';

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

  const isActive = (item) =>
    location.pathname === item.to ||
    // "/" and "/dashboard" are the same page; sub-routes (/pedidos/12) keep their tab lit.
    (item.to === '/' ? location.pathname === '/dashboard' : location.pathname.startsWith(`${item.to}/`));

  const username = user.user || user.username || user.nome || '';
  const initials = (username || 'U').slice(0, 2).toUpperCase();

  const tabs = (labelClass, onNavigate) => (
    <nav aria-label="Principal" className="flex-1 overflow-y-auto overflow-x-hidden py-3">
      <ul>
        {menuItems.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={item.name}
                className={`flex h-11 items-center gap-4 whitespace-nowrap px-[22px] text-[13px] font-medium transition-colors duration-150 ${
                  active ? '-mr-px bg-primary-dark text-white' : 'text-muted hover:bg-brand-bg hover:text-ink'
                }`}
              >
                <span className={`mdi mdi-${ICONS[item.icon] || item.icon} shrink-0 text-[20px]`} aria-hidden="true" />
                <span className={labelClass}>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const account = (labelClass) => (
    <div className="border-t border-border py-3">
      <div className="flex h-11 items-center gap-4 overflow-hidden whitespace-nowrap px-[16px]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-semibold text-white">
          {initials}
        </span>
        <span className={`min-w-0 ${labelClass}`}>
          <span className="block truncate text-[12px] font-medium text-ink">{username}</span>
          <span className="block truncate font-mono text-[10px] text-muted-light">{user.role}</span>
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="flex h-11 w-full items-center gap-4 whitespace-nowrap px-[22px] text-[13px] font-medium text-muted transition-colors duration-150 hover:bg-brand-bg hover:text-ink"
      >
        <span className="mdi mdi-logout shrink-0 text-[20px]" aria-hidden="true" />
        <span className={labelClass}>Sair da conta</span>
      </button>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <img src="/logo-tico-e-tica.png" alt="Tico e Tica" className="h-7 w-auto" />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Tico e Tica</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-md border border-border text-ink"
          aria-label="Abrir menu"
        >
          <span className="mdi mdi-menu text-[18px]" aria-hidden="true" />
        </button>
      </header>

      <aside
        className={`group/rail fixed inset-y-0 left-0 z-30 hidden w-16 flex-col overflow-hidden border-r border-border bg-surface transition-[width,box-shadow] duration-200 ${EASE} hover:w-[232px] hover:shadow-[8px_0_24px_-12px_rgba(23,32,27,0.22)] focus-within:w-[232px] focus-within:shadow-[8px_0_24px_-12px_rgba(23,32,27,0.22)] motion-reduce:transition-none lg:flex`}
      >
        <div className="flex h-14 items-center gap-3 overflow-hidden whitespace-nowrap border-b border-border px-[10px]">
          <img src="/logo-tico-e-tica.png" alt="Tico e Tica" className="h-7 w-auto shrink-0" />
          <span className={`text-[15px] font-semibold tracking-[-0.01em] text-ink ${REVEAL}`}>Tico e Tica</span>
        </div>
        {tabs(REVEAL, undefined)}
        {account(REVEAL)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-[248px] flex-col bg-surface">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-muted hover:text-ink"
              aria-label="Fechar menu"
            >
              <span className="mdi mdi-close text-[18px]" aria-hidden="true" />
            </button>
            <div className="flex h-14 items-center gap-3 border-b border-border px-4">
              <img src="/logo-tico-e-tica.png" alt="Tico e Tica" className="h-7 w-auto" />
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Tico e Tica</span>
            </div>
            {tabs('', () => setMobileOpen(false))}
            {account('')}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
