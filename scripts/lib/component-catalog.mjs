import fs from 'node:fs'
import path from 'node:path'

/** @typedef {{ blockType: string, componentModule: string, componentPath: string, inCms: boolean, schemaPath: string | null, schemaValid: boolean }} BlockEntry */
/** @typedef {{ name: string, path: string, storybook: string | null }} PrimitiveEntry */
/** @typedef {{ blocks: BlockEntry[], primitives: Record<string, PrimitiveEntry[]>, cmsBlockTypes: string[], generatedAt: string, repoRoot: string }} CatalogData */

const PRIMITIVE_CATEGORIES = [
  'layout',
  'content',
  'data',
  'inputs',
  'navigation',
  'sections',
]

const INTERNAL_PRIMITIVES = new Set(['AnimatedStatValue'])

/**
 * @param {string} repoRoot
 * @returns {CatalogData}
 */
export function collectCatalogData(repoRoot) {
  const cmsPath = path.join(repoRoot, 'types/cms.ts')
  const cmsContent = fs.readFileSync(cmsPath, 'utf8')
  const cmsBlockTypes = [...parseCmsBlockTypes(cmsContent)].sort()
  const blocks = collectBlocks(repoRoot, cmsBlockTypes)
  const primitives = collectPrimitives(repoRoot)
  return {
    blocks,
    primitives,
    cmsBlockTypes,
    generatedAt: new Date().toISOString(),
    repoRoot,
  }
}

/**
 * @param {string} repoRoot
 * @returns {BlockEntry[]}
 */
/**
 * @param {string} repoRoot
 * @param {string[]} cmsBlockTypes
 */
function collectBlocks(repoRoot, cmsBlockTypes) {
  const registryPath = path.join(repoRoot, 'components/componentRegistry.ts')
  const schemasDir = path.join(repoRoot, 'config/schemas/blocks')

  const registryContent = fs.readFileSync(registryPath, 'utf8')
  const cmsTypes = new Set(cmsBlockTypes)
  const schemaByType = loadSchemas(schemasDir)

  const registryRegex =
    /^\s+([a-zA-Z0-9_]+):\s*dynamic\(\(\)\s*=>\s*import\('@\/components\/blocks\/([^']+)'\)\)/gm

  /** @type {BlockEntry[]} */
  const entries = []
  let match = registryRegex.exec(registryContent)
  while (match) {
    const blockType = match[1]
    const componentModule = match[2]
    const componentPath = path.join(repoRoot, 'components/blocks', `${componentModule}.tsx`)
    const schemaPath = schemaByType.get(blockType)?.path ?? null
    entries.push({
      blockType,
      componentModule,
      componentPath: toRepoRelative(repoRoot, componentPath),
      inCms: cmsTypes.has(blockType),
      schemaPath: schemaPath ? toRepoRelative(repoRoot, schemaPath) : null,
      schemaValid: schemaByType.get(blockType)?.valid ?? false,
    })
    match = registryRegex.exec(registryContent)
  }

  return entries.sort((a, b) => a.blockType.localeCompare(b.blockType))
}

/**
 * @param {string} content
 * @returns {Set<string>}
 */
function parseCmsBlockTypes(content) {
  const unionMatch = content.match(/export type Block\s*=[\s\S]*?(?=\n\n\/\/|\n\nexport type )/)
  if (!unionMatch) {
    throw new Error('Could not find export type Block union in types/cms.ts')
  }

  const memberNames = [...unionMatch[0].matchAll(/\|\s*(\w+)/g)].map((m) => m[1])
  /** @type {Set<string>} */
  const types = new Set()

  for (const member of memberNames) {
    const typeDefRegex = new RegExp(
      `export type ${member}\\s*=\\s*\\{[\\s\\S]*?_type:\\s*'([^']+)'`,
    )
    const defMatch = content.match(typeDefRegex)
    if (defMatch) {
      types.add(defMatch[1])
    }
  }

  return types
}

/**
 * @param {string} schemasDir
 * @returns {Map<string, { path: string, valid: boolean }>}
 */
function loadSchemas(schemasDir) {
  /** @type {Map<string, { path: string, valid: boolean }>} */
  const byType = new Map()

  if (!fs.existsSync(schemasDir)) {
    return byType
  }

  for (const file of fs.readdirSync(schemasDir)) {
    if (!file.endsWith('.schema.json') || file.startsWith('_')) {
      continue
    }
    const fullPath = path.join(schemasDir, file)
    try {
      const schema = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
      const blockType =
        schema.properties?._type?.const ?? schema.title ?? file.replace('.schema.json', '')
      byType.set(blockType, { path: fullPath, valid: true })
    } catch {
      byType.set(file.replace('.schema.json', ''), { path: fullPath, valid: false })
    }
  }

  return byType
}

/**
 * @param {string} repoRoot
 * @returns {Record<string, PrimitiveEntry[]>}
 */
function collectPrimitives(repoRoot) {
  /** @type {Record<string, PrimitiveEntry[]>} */
  const out = {}

  for (const category of PRIMITIVE_CATEGORIES) {
    const dir = path.join(repoRoot, 'components', category)
    if (!fs.existsSync(dir)) {
      out[category] = []
      continue
    }

    const entries = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.tsx') && !f.endsWith('.stories.tsx'))
      .map((f) => {
        const name = f.replace(/\.tsx$/, '')
        const rel = `components/${category}/${f}`
        const storyPath = path.join(dir, `${name}.stories.tsx`)
        return {
          name,
          path: rel,
          storybook: fs.existsSync(storyPath)
            ? `${capitalize(category)}/${name}`
            : null,
          internal: INTERNAL_PRIMITIVES.has(name),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    out[category] = entries
  }

  return out
}

/**
 * @param {CatalogData} data
 * @returns {string}
 */
export function renderCatalogMarkdown(data) {
  const lines = []
  lines.push('# Component catalog (agent reference)')
  lines.push('')
  lines.push(
    '> **Auto-generated.** Do not edit this file. Run `npm run generate:component-catalog` after changing `componentRegistry.ts`, `types/cms.ts`, block schemas, or primitive components.',
  )
  lines.push('')
  lines.push(`Generated: \`${data.generatedAt}\``)
  lines.push('')
  lines.push('## How to use this catalog')
  lines.push('')
  lines.push(
    '- **Tenant pages (CMS JSON):** compose blocks by `_type` from the [CMS blocks](#cms-blocks) table. Dispatch is via `components/componentRegistry.ts` → `PageRenderer`.',
  )
  lines.push(
    '- **New block implementation:** edit `components/blocks/*.tsx`, `types/cms.ts`, `components/componentRegistry.ts`, and `config/schemas/blocks/*.schema.json`. See `docs/blocks.md`.',
  )
  lines.push(
    '- **Primitives (layout, inputs, etc.):** use when building or extending blocks — not as CMS `_type` values. Prefer Storybook (`npm run storybook`) for props and variants.',
  )
  lines.push(
    '- **Sections** (`components/sections/*`) are usually wrapped by `*Block` components; avoid putting section components directly in page JSON.',
  )
  lines.push('')

  const health = computeHealth(data)
  lines.push('## Health check')
  lines.push('')
  if (health.errors.length === 0 && health.warnings.length === 0) {
    lines.push('All catalog contract checks passed.')
  } else {
    if (health.errors.length > 0) {
      lines.push('### Errors')
      for (const e of health.errors) {
        lines.push(`- ${e}`)
      }
      lines.push('')
    }
    if (health.warnings.length > 0) {
      lines.push('### Warnings')
      for (const w of health.warnings) {
        lines.push(`- ${w}`)
      }
      lines.push('')
    }
  }

  lines.push('## CMS blocks')
  lines.push('')
  lines.push(
    `| _type | Component | TypeScript (cms.ts) | JSON schema |`,
  )
  lines.push('| --- | --- | --- | --- |')
  for (const b of data.blocks) {
    const cms = b.inCms ? 'yes' : '**missing**'
    const schema = b.schemaPath
      ? b.schemaValid
        ? `\`${b.schemaPath}\``
        : `\`${b.schemaPath}\` (invalid JSON)`
      : '_missing_'
    lines.push(
      `| \`${b.blockType}\` | \`${b.componentPath}\` | ${cms} | ${schema} |`,
    )
  }
  lines.push('')
  lines.push(`**Total:** ${data.blocks.length} registered block types.`)
  lines.push('')

  const schemaOrphans = health.schemaOrphans ?? []
  if (schemaOrphans.length > 0) {
    lines.push('### Schemas without registry entry')
    for (const s of schemaOrphans) {
      lines.push(`- \`${s}\``)
    }
    lines.push('')
  }

  for (const category of PRIMITIVE_CATEGORIES) {
    const items = data.primitives[category] ?? []
    lines.push(`## Primitives: ${category}`)
    lines.push('')
    if (items.length === 0) {
      lines.push('_No components._')
      lines.push('')
      continue
    }
    lines.push('| Component | Path | Storybook | Notes |')
    lines.push('| --- | --- | --- | --- |')
    for (const p of items) {
      const story = p.storybook ? `\`${p.storybook}\`` : '—'
      const notes = p.internal ? 'internal helper' : category === 'sections' ? 'use via CMS block' : '—'
      lines.push(`| \`${p.name}\` | \`${p.path}\` | ${story} | ${notes} |`)
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

/**
 * @param {CatalogData} data
 */
export function assertCatalogContracts(data) {
  const health = computeHealth(data)
  if (health.errors.length > 0) {
    throw new Error(
      `Component catalog contract failed:\n${health.errors.map((e) => `  - ${e}`).join('\n')}`,
    )
  }
  return health
}

/**
 * @param {CatalogData} data
 */
function computeHealth(data) {
  /** @type {string[]} */
  const errors = []
  /** @type {string[]} */
  const warnings = []
  /** @type {string[]} */
  const schemaOrphans = []

  const registryTypes = new Set(data.blocks.map((b) => b.blockType))
  const cmsTypes = new Set(data.cmsBlockTypes)
  const missingRegistry = [...cmsTypes].filter((t) => !registryTypes.has(t))

  for (const b of data.blocks) {
    const abs = path.join(data.repoRoot, b.componentPath)
    if (!fs.existsSync(abs)) {
      errors.push(`Registry block "${b.blockType}" points to missing file: ${b.componentPath}`)
    }
    if (!b.inCms) {
      errors.push(
        `Registry block "${b.blockType}" is not in the Block union in types/cms.ts`,
      )
    }
    if (!b.schemaPath) {
      warnings.push(`Registry block "${b.blockType}" has no JSON schema in config/schemas/blocks/`)
    } else if (!b.schemaValid) {
      errors.push(`Schema for "${b.blockType}" is not valid JSON: ${b.schemaPath}`)
    }
  }

  for (const t of missingRegistry) {
    errors.push(`Block union type "${t}" in types/cms.ts has no componentRegistry entry`)
  }

  const schemasDir = path.join(data.repoRoot, 'config/schemas/blocks')
  if (fs.existsSync(schemasDir)) {
    for (const file of fs.readdirSync(schemasDir)) {
      if (!file.endsWith('.schema.json') || file.startsWith('_')) continue
      const fullPath = path.join(schemasDir, file)
      try {
        const schema = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
        const blockType = schema.properties?._type?.const ?? schema.title
        if (blockType && !registryTypes.has(blockType)) {
          schemaOrphans.push(`${file} (_type: ${blockType})`)
          errors.push(
            `Schema ${file} defines _type "${blockType}" but it is not in componentRegistry.ts`,
          )
        }
      } catch {
        errors.push(`Could not parse schema: config/schemas/blocks/${file}`)
      }
    }
  }

  return { errors, warnings, schemaOrphans }
}

/**
 * @param {string} repoRoot
 * @param {string} absPath
 */
function toRepoRelative(repoRoot, absPath) {
  return path.relative(repoRoot, absPath).split(path.sep).join('/')
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
