import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const scriptPath = path.join(repoRoot, 'scripts/generate-component-catalog.mjs')
const catalogPath = path.join(repoRoot, 'docs/agents/component-catalog.md')

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

  it('skips writing when normalized catalog content is unchanged', () => {
    const first = spawnSync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    expect(first.status, first.stderr || first.stdout).toBe(0)

    const before = fs.readFileSync(catalogPath, 'utf8')
    const mtimeBefore = fs.statSync(catalogPath).mtimeMs

    const second = spawnSync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    expect(second.status, second.stderr || second.stdout).toBe(0)
    expect(second.stdout).toContain('up to date')

    const after = fs.readFileSync(catalogPath, 'utf8')
    expect(after).toBe(before)
    expect(fs.statSync(catalogPath).mtimeMs).toBe(mtimeBefore)
  })

  it('writes when the catalog file is missing', () => {
    const backup = fs.readFileSync(catalogPath, 'utf8')
    try {
      fs.rmSync(catalogPath)

      const result = spawnSync(process.execPath, [scriptPath], {
        cwd: repoRoot,
        encoding: 'utf8',
      })
      expect(result.status, result.stderr || result.stdout).toBe(0)
      expect(result.stdout).toMatch(/Wrote .*created/)
      expect(fs.existsSync(catalogPath)).toBe(true)
      expect(fs.readFileSync(catalogPath, 'utf8').length).toBeGreaterThan(100)
    } finally {
      fs.writeFileSync(catalogPath, backup, 'utf8')
    }
  })
})
