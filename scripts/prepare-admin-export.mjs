/**
 * prepare-admin-export.mjs
 *
 * Pre-build script for `npm run build:admin`.
 *
 * Produces a static export of the admin SPA only (app/admin/*) by temporarily
 * moving server-only Route Handlers and public site routes out of app/.
 *
 * Guard: if a prior run was killed with SIGKILL, displaced dirs are restored
 * before proceeding — same pattern as prepare-static-export.mjs.
 *
 * Required env at build time:
 *   NEXT_PUBLIC_ADMIN_API_URL — Azure Functions base URL (baked into client bundle)
 *   CLIENT_ID — any valid client id for root layout theme CSS (not used at runtime)
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextBin = path.join(root, 'node_modules/next/dist/bin/next')

const EXCLUSIONS = [
  { from: 'app/api', to: '.admin-excluded/api' },
  { from: 'app/(site)', to: '.admin-excluded/site' },
]

function abs(rel) {
  return path.join(root, rel)
}

let alreadyRestored = false

function restore() {
  if (alreadyRestored) return
  alreadyRestored = true
  for (const { from, to } of EXCLUSIONS) {
    const held = abs(to)
    const original = abs(from)
    if (fs.existsSync(held) && !fs.existsSync(original)) {
      fs.mkdirSync(path.dirname(original), { recursive: true })
      fs.renameSync(held, original)
      console.log(`[admin-build] restored  ${from}`)
    }
  }
  const holdingDir = abs('.admin-excluded')
  if (fs.existsSync(holdingDir)) {
    try { fs.rmdirSync(holdingDir) } catch { /* not empty — leave it */ }
  }
}

for (const { from, to } of EXCLUSIONS) {
  const held = abs(to)
  const original = abs(from)
  if (fs.existsSync(held) && !fs.existsSync(original)) {
    console.warn(
      `[admin-build] warn: found displaced directory ${to} from a prior interrupted build — restoring before proceeding.`,
    )
    fs.mkdirSync(path.dirname(original), { recursive: true })
    fs.renameSync(held, original)
  }
}

process.on('exit', restore)

process.on('SIGINT', () => {
  restore()
  process.exit(130)
})

process.on('SIGTERM', () => {
  restore()
  process.exit(143)
})

if (!process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim()) {
  console.error('[admin-build] error: NEXT_PUBLIC_ADMIN_API_URL must be set for admin SPA builds.')
  process.exit(1)
}

if (!process.env.CLIENT_ID?.trim()) {
  process.env.CLIENT_ID = '1'
  console.log('[admin-build] CLIENT_ID not set — using default "1" for root layout theme CSS.')
} else {
  process.env.CLIENT_ID = process.env.CLIENT_ID.trim()
}

fs.mkdirSync(abs('.admin-excluded'), { recursive: true })

for (const { from, to } of EXCLUSIONS) {
  const original = abs(from)
  const held = abs(to)
  if (fs.existsSync(original)) {
    fs.renameSync(original, held)
    console.log(`[admin-build] excluded  ${from}`)
  }
}

console.log('[admin-build] running next build (output: export)…')

const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  cwd: root,
  env: {
    ...process.env,
    DEPLOY_TARGET: 'admin',
  },
})

process.exit(result.status ?? 1)
