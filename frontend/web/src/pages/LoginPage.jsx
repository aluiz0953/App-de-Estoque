import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/slices/authSlice';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { prefersReducedMotion, whenIdle } from '../utils/performance';
import Toggle from '../components/Toggle';

const HeroGeometric = lazy(() => import('../components/HeroGeometric'));

// Rose accent (secondary / secondary-dark) blending into the page background (brand-bg).
const BACKGROUND = {
  light: { color1: '#e79ab0', color2: '#f7f9f7' },
  dark: { color1: '#ba4566', color2: '#0f1411' },
};

const emptyRegisterForm = { username: '', email: '', fullName: '', password: '' };

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticating, error } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  // Animated shader background on every device, mounted after first paint so the form
  // is usable immediately. With "reduce motion" it stays as a still frame.
  const [showHero, setShowHero] = useState(false);
  useEffect(() => whenIdle(() => setShowHero(true)), []);
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
      {showHero && (
        <Suspense fallback={null}>
          <HeroGeometric {...BACKGROUND[theme]} speed={prefersReducedMotion() ? 0 : 4} />
        </Suspense>
      )}
      <div className="relative z-10 w-full max-w-[400px] animate-rise rounded-2xl border border-border bg-surface p-8 shadow-[0_18px_55px_rgba(32,61,43,0.09)] md:p-10">
        <div className="mb-8 text-center">
          <img src="/logo-tico-e-tica.png" alt="Tico e Tica" className="mx-auto mb-4 h-16 w-auto" />
          <p className="eyebrow">Tico e Tica · Perfumaria</p>
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

            <div className="inline-flex items-center gap-2 text-[12px] text-muted">
              <Toggle checked={rememberMe} onChange={setRememberMe} aria-labelledby="remember-me-label" />
              <span id="remember-me-label">Manter conectado</span>
            </div>

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
