import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assertCatalogContracts,
  collectCatalogData,
  getCatalogHealth,
  loadAffordances,
  normalizeCatalogMarkdown,
  renderCatalogMarkdown,
} from '../../scripts/lib/component-catalog.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const catalogPath = path.join(repoRoot, 'docs/agents/component-catalog.md')

describe('component catalog contract', () => {
  it('loads affordances for every registered block and primitive', () => {
    const data = collectCatalogData(repoRoot)
    const aff = loadAffordances(repoRoot)
    for (const b of data.blocks) {
      expect(aff.blocks[b.blockType]?.useCases?.length).toBeGreaterThan(0)
      expect(b.useCases.length).toBeGreaterThan(0)
    }
    for (const items of Object.values(data.primitives)) {
      for (const p of items) {
        if (p.internal) continue
        expect(aff.primitives[p.key]?.useCases?.length).toBeGreaterThan(0)
      }
    }
  })

  it('passes registry, cms, schema, affordances, and filesystem checks', () => {
    const data = collectCatalogData(repoRoot)
    const health = assertCatalogContracts(data)
    expect(health.errors).toEqual([])
    expect(
      health.warnings.some((w) => w.includes('no JSON schema')),
    ).toBe(false)
  })

  it('fails with a clear error when a registered block has no schema (acceptance #4)', () => {
    const data = collectCatalogData(repoRoot)
    const hero = data.blocks.find((b) => b.blockType === 'hero')
    expect(hero?.schemaPath).toBeTruthy()

    const withoutSchema = {
      ...data,
      blocks: data.blocks.map((b) =>
        b.blockType === 'hero'
          ? { ...b, schemaPath: null, schemaValid: false, schemaDescription: null }
          : b,
      ),
    }

    const health = getCatalogHealth(withoutSchema)
    expect(health.errors.length).toBeGreaterThan(0)
    expect(health.errors.some((e) => e.includes('hero') && e.includes('JSON schema'))).toBe(
      true,
    )
    expect(() => assertCatalogContracts(withoutSchema)).toThrow(
      /Component catalog contract failed/,
    )
  })

  it('committed component-catalog.md matches the generator output', () => {
    const data = collectCatalogData(repoRoot)
    assertCatalogContracts(data)
    const expected = renderCatalogMarkdown(data)
    const onDisk = fs.readFileSync(catalogPath, 'utf8')
    expect(normalizeCatalogMarkdown(onDisk)).toBe(normalizeCatalogMarkdown(expected))
  })
})
