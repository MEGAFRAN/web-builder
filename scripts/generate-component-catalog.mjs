#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertCatalogContracts,
  collectCatalogData,
  normalizeCatalogMarkdown,
  renderCatalogMarkdown,
} from './lib/component-catalog.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outPath = path.join(repoRoot, 'docs/agents/component-catalog.md')

const data = collectCatalogData(repoRoot)
assertCatalogContracts(data)

const markdown = renderCatalogMarkdown(data)
const relOut = path.relative(repoRoot, outPath)
const summary = `${data.blocks.length} blocks, ${Object.values(data.primitives).flat().length} primitives`

fs.mkdirSync(path.dirname(outPath), { recursive: true })

if (!fs.existsSync(outPath)) {
  fs.writeFileSync(outPath, markdown, 'utf8')
  console.log(`Wrote ${relOut} (${summary}, created)`)
  process.exit(0)
}

const existing = fs.readFileSync(outPath, 'utf8')
if (normalizeCatalogMarkdown(existing) === normalizeCatalogMarkdown(markdown)) {
  console.log(`Component catalog up to date: ${relOut} (${summary})`)
  process.exit(0)
}

fs.writeFileSync(outPath, markdown, 'utf8')
console.log(`Wrote ${relOut} (${summary})`)
