import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import apiService from '../services/api';
import PageHead from '../components/PageHead';

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

  const loadUsers = () => {
    if (sessionUser?.role === 'ADMIN') {
      apiService.getUsuarios().then(setUsers).catch(setUsersError);
    }
  };

  useEffect(loadUsers, [sessionUser?.role]);

  const [roleError, setRoleError] = useState(null);

  const handleActivate = (id) => apiService.activateUsuario(id).then(loadUsers);
  const handleDeactivate = (id) => apiService.deactivateUsuario(id).then(loadUsers);
  const handleReject = (id) => apiService.rejectUsuario(id).then(loadUsers);
  const handleRoleChange = (id, role) => {
    setRoleError(null);
    apiService
      .updateUsuarioRole(id, role)
      .then(loadUsers)
      .catch((err) => setRoleError(err?.body?.message || err.message));
  };

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <PageHead title="Sua conta" />

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <section aria-labelledby="perfil">
          <h2 id="perfil" className="mb-3 text-[15px] font-semibold">
            Perfil
          </h2>
          {profileError ? (
            <p className="text-[13px] text-danger">Erro ao carregar perfil: {profileError.message}</p>
          ) : !profile ? (
            <p className="text-[13px] text-muted">Carregando…</p>
          ) : (
            <div className="sheet flex items-start gap-4 p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-[15px] font-semibold text-white">
                {profile.fullName?.slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase()}
              </div>
              <dl className="flex-1 text-[13px]">
                <Row label="Nome" value={profile.fullName} />
                <Row label="Usuário" value={profile.username} mono />
                <Row label="E-mail" value={profile.email} />
                <Row label="Perfil" value={ROLE_LABEL[profile.role] || profile.role} />
                <Row label="Último acesso" value={profile.lastLogin ? new Date(profile.lastLogin).toLocaleString('pt-BR') : 'Primeiro acesso'} />
              </dl>
            </div>
          )}
        </section>

        <section aria-labelledby="aparencia">
          <h2 id="aparencia" className="mb-1 text-[15px] font-semibold">
            Aparência
          </h2>
          <p className="mb-3 text-[13px] text-muted">Como o sistema aparece para você neste dispositivo.</p>
          <div className="flex gap-3" role="radiogroup" aria-label="Tema">
            <ThemeOption label="Claro" icon="white-balance-sunny" active={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()} />
            <ThemeOption label="Escuro" icon="weather-night" active={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()} />
          </div>
        </section>
      </div>

      {sessionUser?.role === 'ADMIN' && (
        <section className="mt-10" aria-labelledby="equipe">
          <h2 id="equipe" className="mb-1 text-[15px] font-semibold">
            Equipe
          </h2>
          <p className="mb-3 text-[13px] text-muted">Todos os usuários com acesso ao sistema.</p>
          {roleError && (
            <p className="mb-3 text-[13px] text-danger" role="alert">
              {roleError}
            </p>
          )}
          {usersError ? (
            <p className="text-[13px] text-danger">Erro ao carregar usuários: {usersError.message}</p>
          ) : !users ? (
            <p className="text-[13px] text-muted">Carregando…</p>
          ) : (
            <div className="listing">
              <div className="listing-body">
                {users.map((u) => (
                  <div key={u.id} className="listing-row grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.fullName}</p>
                      <p className="truncate text-[12px] text-muted">
                        <span className="font-mono">{u.username}</span> · {u.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {u.username === sessionUser?.user ? (
                        <span className="stamp stamp-off">{ROLE_LABEL[u.role] || u.role}</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          aria-label={`Perfil de ${u.fullName}`}
                          className="h-8 rounded-md border border-border bg-surface px-2 text-[12px] text-ink outline-none focus:border-primary"
                        >
                          {Object.entries(ROLE_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      )}
                      <span className={`stamp ${u.active ? 'stamp-ok' : 'stamp-warn'}`}>{u.active ? 'Ativo' : 'Pendente'}</span>
                      {u.active ? (
                        u.username !== sessionUser?.user && (
                          <button onClick={() => handleDeactivate(u.id)} className="btn btn-quiet h-8 text-[12px]">
                            Desativar
                          </button>
                        )
                      ) : (
                        <>
                          <button onClick={() => handleActivate(u.id)} className="btn btn-primary h-8 text-[12px]">
                            Aprovar
                          </button>
                          {/* Recusar is apart from Aprovar. */}
                          <button onClick={() => handleReject(u.id)} className="btn btn-danger ml-3 h-8 text-[12px]">
                            Recusar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
};

const ThemeOption = ({ label, icon, active, onClick }) => (
  <button
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={`btn h-11 flex-1 justify-start gap-3 border px-4 ${active ? 'border-primary-dark bg-band text-ink' : 'border-border bg-surface text-muted hover:text-ink'}`}
  >
    <span className={`mdi mdi-${icon} text-[18px]`} aria-hidden="true" />
    <span>{label}</span>
    {active && <span className="mdi mdi-check ml-auto text-[16px] text-primary-dark dark:text-primary" aria-hidden="true" />}
  </button>
);

const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0">
    <dt className="text-muted">{label}</dt>
    <dd className={`text-right ${mono ? 'font-mono' : ''}`}>{value}</dd>
  </div>
);

export default UsersPage;
