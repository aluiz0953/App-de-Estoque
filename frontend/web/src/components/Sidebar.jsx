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
    { name: 'Produtos', icon: 'package', to: '/produtos', auth: ['ADMIN', 'MANAGER'] },
    { name: 'Fornecedores', icon: 'delivery-truck', to: '/fornecedores', auth: ['ADMIN', 'MANAGER'] },
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
      <div className="flex h-[86px] items-center gap-3 border-b border-white/10 px-7">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
        </span>
        <span className="font-display text-[21px] text-primary-50">Perfumaria</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <p className="px-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-light">Menu</p>
        <nav className="mt-4 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] transition ${
                  active ? 'bg-primary-dark text-primary-50' : 'text-[#bcaea2] hover:bg-white/5 hover:text-primary-50'
                }`}
              >
                <span className={`mdi mdi-${ICONS[item.icon] || item.icon} text-[17px]`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary font-display text-[14px] text-[#2d2724]">
            {(user.user || user.username || user.nome || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-primary-50">{user.user || user.username || user.nome}</p>
            <p className="truncate text-[10px] text-muted-light">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-[12px] text-[#bcaea2] transition hover:bg-white/5 hover:text-primary-50"
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
          <span className="grid h-8 w-8 place-items-center rounded-full border border-border">
            <span className="h-2 w-2 rounded-full bg-secondary" />
          </span>
          <span className="font-display text-[17px] text-ink">Perfumaria</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-ink"
          aria-label="Abrir menu"
        >
          <span className="mdi mdi-menu text-[18px]" />
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col border-r border-border bg-[#2d2724] lg:flex">
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-[238px] flex-col bg-[#2d2724]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-primary-50/70 hover:text-primary-50"
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
