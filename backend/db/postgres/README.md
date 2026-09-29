# Banco PostgreSQL (Supabase) do backend de estoque

O backend (Spring Boot) escolhe o driver e o dialeto pelo `DB_URL`: `jdbc:mysql://…` (desenvolvimento local, como antes) ou `jdbc:postgresql://…`. Aqui ficam o esquema e os scripts para o Postgres hospedado.

## Segurança do banco (o que já está pronto)
- **Papel restrito para o backend** (`estoque_app`): sem superusuário, sem DDL, sem `BYPASSRLS`; só SELECT/INSERT/UPDATE/DELETE. `audit_logs` só aceita SELECT/INSERT (log de auditoria não pode ser editado nem apagado). Limite de 20 conexões e timeouts (`statement_timeout` 15 s).
- **RLS em todas as tabelas** com uma política só para esse papel: a Data API do Supabase (`anon`/`authenticated`) não enxerga nem altera nada, mesmo que uma chave vaze.
- **Sem acesso padrão** para `PUBLIC`/`anon`/`authenticated` (nem em objetos futuros); ninguém cria objetos no schema `public`.
- **Esquema imutável em produção**: o backend roda com `DDL_AUTO=validate` (só confere), então uma falha no app não consegue alterar tabelas.
- **TLS verificado**: `sslmode=verify-full` com o certificado da CA do Supabase.
- Senhas e URLs ficam só em `.env.supabase` (ignorado pelo git) e nas variáveis do serviço de hospedagem.

## Passo a passo
Na pasta `backend/db/postgres`, com `npm install` feito e `.env.example` copiado para `.env.supabase`:

1. **Esquema** (banco vazio): `node --env-file=.env.supabase apply-schema.mjs`
2. **Dados** (opcional, do MySQL atual): `node --env-file=.env.supabase migrate-data.mjs` — tudo numa transação, mantém os ids, confere as contagens e recusa tabela que já tenha linhas.
3. **Primeiro administrador** (se não copiou os dados): `node --env-file=.env.supabase create-admin.mjs`
4. **Endurecimento**: `node --env-file=.env.supabase harden.mjs` (pode repetir; rode de novo depois de qualquer mudança de esquema).
5. **Hospedagem do backend** (variáveis do serviço): 
   - `DB_URL=jdbc:postgresql://<host-do-session-pooler>:5432/postgres?sslmode=verify-full&sslrootcert=<caminho-do-certificado>`
   - `DB_USERNAME=estoque_app.<ref-do-projeto>` e `DB_PASSWORD=<APP_DB_PASSWORD>`
   - `DDL_AUTO=validate`
6. **No painel do Supabase**: ligar *Enforce SSL*, desligar a Data API se ela não for usada, restringir IPs quando o plano permitir, conferir *Advisors → Security* (sem alertas) e lembrar que o plano gratuito não faz backup pontual.

`001_schema.sql` foi gerado pelo Hibernate (Postgres 17) e mostra as 12 tabelas atuais; mudanças de esquema entram aqui de forma deliberada.
