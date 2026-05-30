import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const scriptPath = path.join(repoRoot, 'scripts/generate-component-catalog.mjs')
const catalogPath = path.join(repoRoot, 'docs/agents/component-catalog.md')

const tempFiles = []

afterEach(() => {
  for (const file of tempFiles.splice(0)) {
    fs.rmSync(file, { force: true })
  }
})

describe('generate-component-catalog.mjs', () => {
  it('exits 0 and writes docs/agents/component-catalog.md', () => {
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    expect(result.status, result.stderr || result.stdout).toBe(0)
    expect(fs.existsSync(catalogPath)).toBe(true)
    const content = fs.readFileSync(catalogPath, 'utf8')
    expect(content).toContain('# Component catalog (agent reference)')
    expect(content).toContain('## CMS blocks')
    expect(content).toContain('`reservationBlock`')
    expect(content).toContain('## Primitives: layout')
  })
})
