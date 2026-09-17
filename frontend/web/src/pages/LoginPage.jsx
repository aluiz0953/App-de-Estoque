import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/slices/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticating, error } = useSelector((state) => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    try {
      await dispatch(login({ username, password })).unwrap();
      navigate('/dashboard');
    } catch (err) {
      // error is already reflected in state.auth.error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 font-sans text-ink">
      <div className="w-full max-w-[400px] animate-rise rounded-2xl border border-border bg-surface p-8 shadow-[0_18px_55px_rgba(63,47,35,0.09)] md:p-10">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full border border-border">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
          </span>
          <p className="eyebrow">Perfumaria</p>
          <h1 className="font-display mt-2 text-[30px] tracking-[-0.02em]">Sistema de Estoque</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Usuário</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              autoFocus
              className="h-11 w-full rounded-lg border border-border bg-brand-bg px-3 text-[13px] outline-none placeholder:text-muted-light focus:border-secondary-dark"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="h-11 w-full rounded-lg border border-border bg-brand-bg px-3 text-[13px] outline-none placeholder:text-muted-light focus:border-secondary-dark"
            />
          </label>

          {error && (
            <p className="text-[12px] text-danger">{typeof error === 'string' ? error : 'Usuário ou senha inválidos'}</p>
          )}

          <button
            type="submit"
            disabled={isAuthenticating || !username || !password}
            className="pressable mt-2 h-11 w-full rounded-full bg-primary text-[13px] font-medium text-primary-50 transition hover:bg-primary-dark disabled:opacity-50"
          >
            {isAuthenticating ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
