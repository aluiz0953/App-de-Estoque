// Locks the database down (idempotent; run as the OWNER after apply-schema / migrate-data):
//   APP_DB_USER=estoque_app APP_DB_PASSWORD=<24+ chars> node --env-file=... harden.mjs
//  1. Row level security on every public table, with ONE policy for the app role: anyone else (Supabase
//     anon/authenticated via the Data API) reads and writes nothing, even if a key leaks.
//  2. A least-privilege login role for the backend: no superuser/createdb/createrole/bypassrls, DML only
//     (audit_logs is append-only: SELECT and INSERT), no DDL, connection limit and timeouts.
//  3. No default access for PUBLIC/anon/authenticated on tables and sequences (and none for anon/authenticated
//     on functions), now and for future objects.
import { connect } from './lib.mjs'

const appUser = process.env.APP_DB_USER
const appPassword = process.env.APP_DB_PASSWORD
if (!appUser || !appPassword || !/^[a-z_][a-z0-9_]{2,40}$/.test(appUser)) {
  console.error('Set APP_DB_USER (lower case letters, digits, _) and APP_DB_PASSWORD.')
  process.exit(1)
}
if (appPassword.length < 24) {
  console.error('APP_DB_PASSWORD must have at least 24 characters (generate a random one).')
  process.exit(1)
}

const client = await connect()
const ident = (name) => client.escapeIdentifier(name)
const appendOnly = new Set(['audit_logs'])

try {
  await client.query('BEGIN')
  const existing = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [appUser])
  const attributes = 'LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 20'
  await client.query(`${existing.rowCount ? 'ALTER' : 'CREATE'} ROLE ${ident(appUser)} ${attributes} PASSWORD ${client.escapeLiteral(appPassword)}`)
  await client.query(`ALTER ROLE ${ident(appUser)} SET statement_timeout = '15s'`)
  await client.query(`ALTER ROLE ${ident(appUser)} SET idle_in_transaction_session_timeout = '30s'`)

  const api = (await client.query(`SELECT rolname FROM pg_roles WHERE rolname = ANY($1)`, [['anon', 'authenticated']])).rows.map((r) => r.rolname)
  const revokeFrom = ['PUBLIC', ...api].join(', ')
  await client.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC')
  await client.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${revokeFrom}`)
  await client.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ${revokeFrom}`)
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM ${revokeFrom}`)
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM ${revokeFrom}`)
  if (api.length) {
    await client.query(`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM ${api.join(', ')}`)
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM ${api.join(', ')}`)
  }

  await client.query(`GRANT USAGE ON SCHEMA public TO ${ident(appUser)}`)
  await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${ident(appUser)}`)

  const tables = (await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`)).rows
  for (const { tablename } of tables) {
    const table = `public.${ident(tablename)}`
    await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
    await client.query(`DROP POLICY IF EXISTS app_access ON ${table}`)
    await client.query(`CREATE POLICY app_access ON ${table} FOR ALL TO ${ident(appUser)} USING (true) WITH CHECK (true)`)
    const privileges = appendOnly.has(tablename) ? 'SELECT, INSERT' : 'SELECT, INSERT, UPDATE, DELETE'
    await client.query(`GRANT ${privileges} ON ${table} TO ${ident(appUser)}`)
  }
  await client.query('COMMIT')
  console.log(`hardened ${tables.length} tables; role ${appUser} is DML-only (no DDL); anon/authenticated/PUBLIC have no access`)
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error(`failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await client.end()
}
