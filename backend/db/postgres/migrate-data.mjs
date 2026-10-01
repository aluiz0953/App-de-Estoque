// One-off copy of every row from the MySQL database to the (empty) PostgreSQL one, keeping ids:
//   MYSQL_URL=mysql://user:pass@host:3306/perfumaria_estoque node --env-file=... migrate-data.mjs
// Runs as the OWNER, in a single transaction (all or nothing), then resets the id sequences and compares
// row counts. Refuses to run when a target table already has rows. Read-only on the MySQL side.
import mysql from 'mysql2/promise'
import { connect } from './lib.mjs'

if (!process.env.MYSQL_URL) {
  console.error('Set MYSQL_URL (source database).')
  process.exit(1)
}

const source = await mysql.createConnection({ uri: process.env.MYSQL_URL, dateStrings: true })
const target = await connect()
const ident = (name) => target.escapeIdentifier(name)

try {
  const tables = (await target.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`)).rows.map((row) => row.tablename)
  const foreignKeys = (
    await target.query(`
      SELECT c.conrelid::regclass::text AS child, c.confrelid::regclass::text AS parent
      FROM pg_constraint c WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace`)
  ).rows.map((row) => [row.child.replace('public.', ''), row.parent.replace('public.', '')])

  // Parents before children (self references are fine: rows are inserted in id order).
  const ordered = []
  const pending = new Set(tables)
  while (pending.size) {
    const ready = [...pending].filter((table) => foreignKeys.every(([child, parent]) => child !== table || parent === table || !pending.has(parent)))
    if (!ready.length) throw new Error('Cyclic foreign keys: cannot order tables.')
    ready.sort().forEach((table) => {
      ordered.push(table)
      pending.delete(table)
    })
  }

  for (const table of ordered) {
    const count = (await target.query(`SELECT count(*)::int AS n FROM ${ident(table)}`)).rows[0].n
    if (count) throw new Error(`Target table ${table} already has rows: refusing to copy over them.`)
  }

  await target.query('BEGIN')
  const report = []
  for (const table of ordered) {
    const columns = (
      await target.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`, [table])
    ).rows
    const [exists] = await source.query('SHOW TABLES LIKE ?', [table])
    if (!exists.length) {
      report.push([table, 0, 0])
      continue
    }
    const [sourceColumns] = await source.query('SHOW COLUMNS FROM ??', [table])
    const shared = columns.filter((column) => sourceColumns.some((sc) => sc.Field === column.column_name))
    const [rows] = await source.query('SELECT * FROM ?? ORDER BY 1', [table])
    for (let start = 0; start < rows.length; start += 200) {
      const batch = rows.slice(start, start + 200)
      const values = []
      const tuples = batch.map((row) => {
        const placeholders = shared.map((column) => {
          let value = row[column.column_name]
          if (column.data_type === 'boolean' && value !== null) value = Boolean(Number(value))
          values.push(value)
          return `$${values.length}`
        })
        return `(${placeholders.join(', ')})`
      })
      await target.query(`INSERT INTO ${ident(table)} (${shared.map((c) => ident(c.column_name)).join(', ')}) OVERRIDING SYSTEM VALUE VALUES ${tuples.join(', ')}`, values)
    }
    if (columns.some((column) => column.column_name === 'id')) {
      await target.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM ${ident(table)}`, [`public.${table}`])
    }
    const copied = (await target.query(`SELECT count(*)::int AS n FROM ${ident(table)}`)).rows[0].n
    report.push([table, rows.length, copied])
  }
  const mismatch = report.filter(([, from, to]) => from !== to)
  if (mismatch.length) throw new Error(`Row counts differ: ${JSON.stringify(mismatch)}`)
  await target.query('COMMIT')
  for (const [table, from, to] of report) console.log(`${table}: ${from} -> ${to}`)
  console.log('done')
} catch (error) {
  await target.query('ROLLBACK').catch(() => {})
  console.error(error.message)
  process.exitCode = 1
} finally {
  await source.end()
  await target.end()
}
