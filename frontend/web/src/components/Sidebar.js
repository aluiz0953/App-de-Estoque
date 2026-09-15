import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useSelector(state => state.auth);
  const isAuthenticated = !!user;

  const menuItems = [
    { name: 'Dashboard', icon: 'home', to: '/', auth: true },
    { name: 'Estoque', icon: 'package-variant', to: '/estoque', auth: true },
    { name: 'Produtos', icon: 'package', to: '/produtos', auth: ['ADMIN', 'MANAGER'] },
    { name: 'Fornecedores', icon: 'delivery-truck', to: '/fornecedores', auth: ['ADMIN', 'MANAGER'] },
    { name: 'Marcas', icon: 'copyright', to: '/marcas', auth: ['ADMIN', 'MANAGER'] },
    { name: 'Linhas', icon: 'format-list-bulleted', to: '/linhas', auth: ['ADMIN', 'MANAGER'] },
    { name: 'Notificações', icon: 'bell', to: '/notificacoes', auth: ['ADMIN', 'MANAGER', 'AUDITOR'] },
    { name: 'Relatórios', icon: 'chart-bar', to: '/relatorios', auth: ['ADMIN', 'MANAGER'] },
    { name: 'Usuários', icon: 'account-multiple', to: '/usuarios', auth: ['ADMIN'] }
  ];

  const renderMenuItems = () => {
    return menuItems
      .filter(item => {
        if (!isAuthenticated) return false;
        if (!item.auth) return true;
        if (Array.isArray(item.auth)) {
          return item.auth.includes(user.role);
        }
        return true;
      })
      .map((item, index) => (
        <div key={index} className="menu-item">
          <Link to={item.to} className={`menu-link ${item.to === window.location.pathname ? 'active' : ''}`}>
            <span className={`menu-icon mdi mdi-${item.icon}`}></span>
            <span className="menu-text">{item.name}</span>
          </Link>
        </div>
      ));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Perfumaria Estoque</h3>
      </div>
      <nav className="sidebar-nav">
        {renderMenuItems()}
      </nav>
      {isAuthenticated && (
        <div className="sidebar-footer">
          <button className="btn-logout-sidebar" onClick={handleLogout}>
            Sair
          </button>
        </div>
      )}
    </aside>
  );
};

const handleLogout = () => {
  // Em uma implementação real, você dispararia a ação de logout do Redux
  window.location.href = '/login';
};

export default Sidebar;