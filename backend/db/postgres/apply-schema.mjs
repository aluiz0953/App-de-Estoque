// Creates the tables (001_schema.sql) in an EMPTY database, in one transaction:
//   node --env-file=backend/db/postgres/.env.supabase backend/db/postgres/apply-schema.mjs
// Later migrations (002_*.sql, ...) are applied by name, to a database that already has the schema:
//   node --env-file=... apply-schema.mjs 002_revistas.sql
import { readFileSync } from 'node:fs'
import { connect } from './lib.mjs'

const client = await connect()
try {
  const migrations = process.argv.slice(2)
  const existing = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios'`)
  if (!migrations.length && existing.rowCount) throw new Error('The database already has the schema: refusing to apply it twice.')
  if (migrations.length && !existing.rowCount) throw new Error('Apply 001_schema.sql first (run without arguments).')
  await client.query('BEGIN')
  for (const file of migrations.length ? migrations : ['001_schema.sql']) {
    if (!/^\d{3}_[a-z_]+\.sql$/.test(file)) throw new Error(`Not a migration file name: ${file}`)
    await client.query(readFileSync(new URL(`./${file}`, import.meta.url), 'utf8'))
  }
  await client.query('COMMIT')
  console.log('schema applied')
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error(error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
