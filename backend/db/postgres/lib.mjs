// Shared by the scripts here: a pg client for DATABASE_URL (the OWNER role, e.g. postgres on Supabase),
// with TLS verified against DATABASE_SSL_CA_PATH when set. Put values with # in quotes in env files.
import { readFileSync } from 'node:fs'
import pg from 'pg'

export async function connect(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('Set DATABASE_URL (owner role; Supabase Session pooler URL, without ?sslmode=).')
  const ssl = process.env.DATABASE_SSL_CA_PATH
    ? { ca: readFileSync(process.env.DATABASE_SSL_CA_PATH, 'utf8') }
    : process.env.DATABASE_SSL === 'true'
      ? true
      : undefined
  const client = new pg.Client({ connectionString: url, ssl })
  await client.connect()
  return client
}
