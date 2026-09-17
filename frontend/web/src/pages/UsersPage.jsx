import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import apiService from '../services/api';

const ROLE_LABEL = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  OPERATOR: 'Operador',
  AUDITOR: 'Auditor',
};

const UsersPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user: sessionUser } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [users, setUsers] = useState(null);
  const [usersError, setUsersError] = useState(null);

  useEffect(() => {
    apiService.getProfile().then(setProfile).catch(setProfileError);
  }, []);

  useEffect(() => {
    if (sessionUser?.role === 'ADMIN') {
      apiService.getUsuarios().then(setUsers).catch(setUsersError);
    }
  }, [sessionUser?.role]);

  return (
    <main className="p-5 md:p-9">
      <p className="eyebrow">Conta</p>
      <h2 className="font-display mb-8 mt-3 text-[34px] tracking-[-0.03em] md:text-[40px]">Sua conta.</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-6">
          <h3 className="font-display mb-4 text-[22px]">Perfil</h3>
          {profileError ? (
            <p className="text-[13px] text-danger">Erro ao carregar perfil: {profileError.message}</p>
          ) : !profile ? (
            <p className="text-[13px] text-muted-light">Carregando...</p>
          ) : (
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary font-display text-[20px] text-[#2d2724]">
                {profile.fullName?.slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase()}
              </div>
              <dl className="grid flex-1 gap-2 text-[13px]">
                <Row label="Nome" value={profile.fullName} />
                <Row label="Usuário" value={profile.username} mono />
                <Row label="E-mail" value={profile.email} />
                <Row label="Perfil" value={ROLE_LABEL[profile.role] || profile.role} />
                <Row
                  label="Último acesso"
                  value={profile.lastLogin ? new Date(profile.lastLogin).toLocaleString('pt-BR') : 'Primeiro acesso'}
                />
              </dl>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <h3 className="font-display mb-1 text-[22px]">Aparência</h3>
          <p className="mb-5 text-[12px] text-muted-light">Escolha como o sistema aparece para você neste dispositivo.</p>
          <div className="flex gap-3">
            <ThemeOption
              label="Claro"
              icon="white-balance-sunny"
              active={theme === 'light'}
              onClick={() => theme !== 'light' && toggleTheme()}
            />
            <ThemeOption
              label="Escuro"
              icon="weather-night"
              active={theme === 'dark'}
              onClick={() => theme !== 'dark' && toggleTheme()}
            />
          </div>
        </section>
      </div>

      {sessionUser?.role === 'ADMIN' && (
        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_35px_rgba(63,47,35,0.04)]">
          <div className="border-b border-border p-5">
            <h3 className="font-display text-[22px]">Equipe</h3>
            <p className="mt-1 text-[12px] text-muted-light">Todos os usuários com acesso ao sistema.</p>
          </div>
          {usersError ? (
            <p className="p-5 text-[13px] text-danger">Erro ao carregar usuários: {usersError.message}</p>
          ) : !users ? (
            <p className="p-5 text-[13px] text-muted-light">Carregando...</p>
          ) : (
            <div>
              {users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium">{u.fullName}</p>
                    <p className="text-[11px] text-muted-light">
                      {u.username} · {u.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#efe9e2] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#5b4842]">
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${
                        u.active ? 'bg-[#dce6d8] text-[#5f7658]' : 'bg-[#ded7d4] text-[#716562]'
                      }`}
                    >
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
};

const ThemeOption = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pressable flex flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-5 transition ${
      active ? 'border-secondary-dark bg-[#efe9e2] text-[#2d2724]' : 'border-border text-muted hover:bg-brand-bg'
    }`}
  >
    <span className={`mdi mdi-${icon} text-[22px]`} />
    <span className="text-[12px] font-medium">{label}</span>
    {active && <span className="mdi mdi-check-circle text-[13px] text-secondary-dark" />}
  </button>
);

const Row = ({ label, value, mono }) => (
  <div className="flex items-center justify-between gap-3">
    <dt className="text-muted-light">{label}</dt>
    <dd className={mono ? 'tabular-nums' : ''}>{value}</dd>
  </div>
);

export default UsersPage;
