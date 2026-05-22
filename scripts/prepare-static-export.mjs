/**
 * prepare-static-export.mjs
 *
 * Pre-build script for `npm run build:blob`.
 *
 * Next.js with `output: 'export'` cannot include server-only routes (Route
 * Handlers that use POST/PATCH/DELETE, or dynamic routes without
 * generateStaticParams). The directories below are excluded from the route
 * tree during the static export build and restored immediately after — whether
 * the build succeeds or fails.
 *
 * Guard: if a prior run was killed with SIGKILL (uncatchable), the excluded
 * dirs are left displaced. This script detects and restores them before
 * proceeding, so the source tree is always in a valid state at the start.
 *
 * Deployment target: Azure Blob Storage (static files only).
 * Local dev (`npm run dev`) and the admin portal are unaffected.
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextBin = path.join(root, 'node_modules/next/dist/bin/next')

/**
 * Server-only directories to exclude from the static export build.
 * Each entry maps the original path (relative to repo root) to a temporary
 * holding path also relative to repo root — outside `app/` so Next.js does
 * not scan them.
 */
const EXCLUSIONS = [
  { from: 'app/api',   to: '.blob-excluded/api' },
  { from: 'app/admin', to: '.blob-excluded/admin' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

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
      console.log(`[blob-build] restored  ${from}`)
    }
  }
  // Remove the holding directory if empty
  const holdingDir = abs('.blob-excluded')
  if (fs.existsSync(holdingDir)) {
    try { fs.rmdirSync(holdingDir) } catch { /* not empty — leave it */ }
  }
}

// ─── Guard: recover from a prior SIGKILL ────────────────────────────────────

for (const { from, to } of EXCLUSIONS) {
  const held = abs(to)
  const original = abs(from)
  if (fs.existsSync(held) && !fs.existsSync(original)) {
    console.warn(
      `[blob-build] warn: found displaced directory ${to} from a prior interrupted build — restoring before proceeding.`,
    )
    fs.mkdirSync(path.dirname(original), { recursive: true })
    fs.renameSync(held, original)
  }
}

// ─── Register cleanup on all catchable exits ─────────────────────────────────

process.on('exit', restore)

process.on('SIGINT', () => {
  restore()
  process.exit(130)
})

process.on('SIGTERM', () => {
  restore()
  process.exit(143)
})

// ─── Move server-only dirs outside app/ ─────────────────────────────────────

fs.mkdirSync(abs('.blob-excluded'), { recursive: true })

for (const { from, to } of EXCLUSIONS) {
  const original = abs(from)
  const held = abs(to)
  if (fs.existsSync(original)) {
    fs.renameSync(original, held)
    console.log(`[blob-build] excluded  ${from}`)
  }
}

// ─── Run next build with DEPLOY_TARGET=blob ──────────────────────────────────

console.log('[blob-build] running next build (output: export, trailingSlash: true)…')

const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  cwd: root,
  env: {
    ...process.env,
    DEPLOY_TARGET: 'blob',
  },
})

// restore() is called by the process 'exit' handler below
process.exit(result.status ?? 1)
