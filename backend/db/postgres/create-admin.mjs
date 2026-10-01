// Creates the first ADMIN in an empty database (credentials from the environment, never from arguments):
//   ADMIN_USERNAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_NAME=...] node --env-file=... create-admin.mjs
import bcrypt from 'bcryptjs'
import { connect } from './lib.mjs'

const username = process.env.ADMIN_USERNAME?.trim()
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const fullName = process.env.ADMIN_NAME?.trim() || 'Administrador'

if (!username || !email || !password) {
  console.error('Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD.')
  process.exit(1)
}
const strong = password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
if (!strong) {
  console.error('Weak password: at least 12 characters with lower case, upper case, a digit and a symbol.')
  process.exit(1)
}

const client = await connect()
try {
  const taken = await client.query('SELECT 1 FROM usuarios WHERE username = $1 OR email = $2', [username, email])
  if (taken.rowCount) throw new Error('That username or e-mail already exists.')
  await client.query(
    `INSERT INTO usuarios (username, password_hash, email, full_name, role, is_active, created_at, updated_at, failed_login_attempts)
     VALUES ($1, $2, $3, $4, 'ADMIN', true, now(), now(), 0)`,
    [username, await bcrypt.hash(password, 12), email, fullName],
  )
  console.log("admin created")
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
