#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertCatalogContracts,
  collectCatalogData,
  renderCatalogMarkdown,
} from './lib/component-catalog.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outPath = path.join(repoRoot, 'docs/agents/component-catalog.md')

const data = collectCatalogData(repoRoot)
assertCatalogContracts(data)

const markdown = renderCatalogMarkdown(data)
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, markdown, 'utf8')

console.log(`Wrote ${path.relative(repoRoot, outPath)} (${data.blocks.length} blocks, ${Object.values(data.primitives).flat().length} primitives)`)
