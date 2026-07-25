#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FORBIDDEN_KEYS = [
  'servicesEndpoint',
  'bookingServicesEndpoint',
  'bookingApiUrl',
  'adminApiUrl',
  'reservationEndpoint',
  'companyProfileEndpoint',
]

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLIENTS_DIR = path.join(repoRoot, 'config/clients')

/**
 * @returns {string[]}
 */
function listClientJsonPaths() {
  return fs
    .readdirSync(CLIENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(CLIENTS_DIR, entry.name, 'client.json'))
    .filter((filePath) => fs.existsSync(filePath))
    .sort()
}

/**
 * @param {unknown} clientConfig
 */
function isBookingEnabled(clientConfig) {
  return (
    clientConfig !== null &&
    typeof clientConfig === 'object' &&
    /** @type {{ features?: { booking?: boolean } }} */ (clientConfig).features?.booking === true
  )
}

/**
 * @param {string} source
 * @returns {{ line: number; key: string }[]}
 */
function findForbiddenKeysInSource(source) {
  const lines = source.split('\n')
  /** @type {{ line: number; key: string }[]} */
  const violations = []

  for (const key of FORBIDDEN_KEYS) {
    const pattern = new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:`)
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        violations.push({ line: index + 1, key })
      }
    })
  }

  return violations
}

function main() {
  const clientJsonPaths = listClientJsonPaths()
  /** @type {{ relPath: string; line: number; key: string }[]} */
  const allViolations = []

  for (const filePath of clientJsonPaths) {
    const relPath = path.relative(repoRoot, filePath)
    const source = fs.readFileSync(filePath, 'utf8')

    let clientConfig
    try {
      clientConfig = JSON.parse(source)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(`ERROR ${relPath}`)
      console.log(`  Invalid JSON: ${message}`)
      allViolations.push({ relPath, line: 0, key: '(invalid JSON)' })
      continue
    }

    if (isBookingEnabled(clientConfig)) continue

    for (const { line, key } of findForbiddenKeysInSource(source)) {
      allViolations.push({ relPath, line, key })
    }
  }

  const grouped = new Map()
  for (const violation of allViolations) {
    if (!grouped.has(violation.relPath)) grouped.set(violation.relPath, [])
    grouped.get(violation.relPath).push(violation)
  }

  for (const [relPath, violations] of grouped) {
    console.log(`ERROR ${relPath}`)
    for (const { line, key } of violations) {
      if (line === 0) continue
      console.log(`  Line ${line}: "${key}" is forbidden when features.booking is false.`)
      console.log(
        '  Static clients must not reference runtime APIs — remove the key or set features.booking to true (booking product only).',
      )
    }
  }

  if (allViolations.length > 0) {
    const label = allViolations.length === 1 ? '1 violation' : `${allViolations.length} violations`
    console.log(`\n${label} found. Guard failed.`)
    process.exit(1)
  }

  process.exit(0)
}

main()
