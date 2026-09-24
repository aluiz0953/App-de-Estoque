import React, { lazy, Suspense, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/slices/authSlice';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const HeroGeometric = lazy(() => import('../components/HeroGeometric'));

// Rose accent (secondary / secondary-dark) blending into the page background (brand-bg).
const BACKGROUND = {
  light: { color1: '#d5a0a2', color2: '#f4efe8' },
  dark: { color1: '#a96d6e', color2: '#1c1815' },
};

const emptyRegisterForm = { username: '', email: '', fullName: '', password: '' };

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticating, error } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    try {
      await dispatch(login({ username, password, rememberMe })).unwrap();
      navigate('/dashboard');
    } catch (err) {
      // error is already reflected in state.auth.error
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setRegisterError(null);
    setRegisterSuccess(null);
  };

  const handleRegisterChange = (field, value) => setRegisterForm((prev) => ({ ...prev, [field]: value }));

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegisterError(null);
    try {
      const result = await apiService.register({
        username: registerForm.username,
        email: registerForm.email,
        fullName: registerForm.fullName,
        passwordHash: registerForm.password, // API accepts the plain password on this field; server hashes it
      });
      setRegisterSuccess(result.message || 'Conta criada. Aguarde um administrador liberar seu acesso.');
      setRegisterForm(emptyRegisterForm);
    } catch (err) {
      setRegisterError(err?.body?.message || err?.message || 'Erro ao criar conta');
    } finally {
      setIsRegistering(false);
    }
  };

  const registerDisabled =
    isRegistering || !registerForm.username || !registerForm.email || !registerForm.fullName || !registerForm.password;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-bg px-4 py-10 font-sans text-ink">
      <Suspense fallback={null}>
        <HeroGeometric {...BACKGROUND[theme]} speed={4} />
      </Suspense>
      <div className="relative z-10 w-full max-w-[400px] animate-rise rounded-2xl border border-border bg-surface p-8 shadow-[0_18px_55px_rgba(63,47,35,0.09)] md:p-10">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full border border-border">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
          </span>
          <p className="eyebrow">Perfumaria</p>
          <h1 className="font-display mt-2 text-[30px] tracking-[-0.02em]">Sistema de Estoque</h1>
        </div>

        {mode === 'login' ? (
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="h-11 w-full rounded-lg border border-border bg-brand-bg px-3 pr-16 text-[13px] outline-none placeholder:text-muted-light focus:border-secondary-dark"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-secondary-dark hover:text-primary"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </label>

            <label className="inline-flex items-center gap-2 text-[12px] text-muted">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Manter conectado
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

            <button
              type="button"
              onClick={() => switchMode('register')}
              className="text-[12px] font-medium text-secondary-dark hover:text-primary"
            >
              Criar conta
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="grid gap-4">
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Nome completo</span>
              <input
                value={registerForm.fullName}
                onChange={(e) => handleRegisterChange('fullName', e.target.value)}
                autoFocus
                className="h-11 w-full rounded-lg border border-border bg-brand-bg px-3 text-[13px] outline-none placeholder:text-muted-light focus:border-secondary-dark"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Usuário</span>
              <input
                value={registerForm.username}
                onChange={(e) => handleRegisterChange('username', e.target.value)}
                autoCapitalize="none"
                className="h-11 w-full rounded-lg border border-border bg-brand-bg px-3 text-[13px] outline-none placeholder:text-muted-light focus:border-secondary-dark"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">E-mail</span>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => handleRegisterChange('email', e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-brand-bg px-3 text-[13px] outline-none placeholder:text-muted-light focus:border-secondary-dark"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">Senha</span>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => handleRegisterChange('password', e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-brand-bg px-3 text-[13px] outline-none placeholder:text-muted-light focus:border-secondary-dark"
              />
            </label>

            <p className="text-[11px] text-muted-light">
              Sua conta fica pendente até um administrador liberar o acesso.
            </p>

            {registerError && <p className="text-[12px] text-danger">{registerError}</p>}
            {registerSuccess && <p className="text-[12px] text-success">{registerSuccess}</p>}

            <button
              type="submit"
              disabled={registerDisabled}
              className="pressable mt-2 h-11 w-full rounded-full bg-primary text-[13px] font-medium text-primary-50 transition hover:bg-primary-dark disabled:opacity-50"
            >
              {isRegistering ? 'Criando conta...' : 'Criar conta'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-[12px] font-medium text-secondary-dark hover:text-primary"
            >
              Já tenho conta
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
