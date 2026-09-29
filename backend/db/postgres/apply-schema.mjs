// Creates the tables (001_schema.sql) in an EMPTY database, in one transaction:
//   node --env-file=backend/db/postgres/.env.supabase backend/db/postgres/apply-schema.mjs
import { readFileSync } from 'node:fs'
import { connect } from './lib.mjs'

const client = await connect()
try {
  const existing = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios'`)
  if (existing.rowCount) throw new Error('The database already has the schema: refusing to apply it twice.')
  await client.query('BEGIN')
  await client.query(readFileSync(new URL('./001_schema.sql', import.meta.url), 'utf8'))
  await client.query('COMMIT')
  console.log('schema applied')
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error(error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
