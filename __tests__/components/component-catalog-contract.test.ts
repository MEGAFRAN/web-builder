import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assertCatalogContracts,
  collectCatalogData,
  renderCatalogMarkdown,
} from '../../scripts/lib/component-catalog.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const catalogPath = path.join(repoRoot, 'docs/agents/component-catalog.md')

describe('component catalog contract', () => {
  it('passes registry, cms, schema, and filesystem checks', () => {
    const data = collectCatalogData(repoRoot)
    const health = assertCatalogContracts(data)
    expect(health.errors).toEqual([])
  })

  it('committed component-catalog.md matches the generator output', () => {
    const data = collectCatalogData(repoRoot)
    assertCatalogContracts(data)
    const expected = renderCatalogMarkdown(data)
    const onDisk = fs.readFileSync(catalogPath, 'utf8')
    const normalize = (s: string) =>
      s.replace(/^Generated: `[^`]+`/m, 'Generated: `<timestamp>`')
    expect(normalize(onDisk)).toBe(normalize(expected))
  })
})
