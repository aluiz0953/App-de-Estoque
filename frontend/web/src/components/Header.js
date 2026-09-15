import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Header.css';

const Header = () => {
  const { user } = useSelector(state => state.auth);

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Perfumaria Estoque
        </Link>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-info">
                Olá, {user.username} ({user.role})
              </span>
              <button className="btn-logout" onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-login">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const handleLogout = () => {
  // Em uma implementação real, você dispararia a ação de logout do Redux
  window.location.href = '/login';
};

export default Header;