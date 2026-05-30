import fs from 'node:fs'
import path from 'node:path'

const AFFORDANCES_PATH = 'config/component-affordances.json'

/** @typedef {{ useCases: string[], avoidWhen?: string[] }} AffordanceEntry */
/** @typedef {{ blockType: string, componentModule: string, componentPath: string, inCms: boolean, schemaPath: string | null, schemaValid: boolean, schemaDescription: string | null, useCases: string[], avoidWhen: string[] }} BlockEntry */
/** @typedef {{ name: string, path: string, storybook: string | null, internal: boolean, key: string, useCases: string[], avoidWhen: string[] }} PrimitiveEntry */
/** @typedef {{ blocks: BlockEntry[], primitives: Record<string, PrimitiveEntry[]>, cmsBlockTypes: string[], affordancesPath: string, generatedAt: string, repoRoot: string }} CatalogData */

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
 * Strip volatile lines so catalog output can be compared across runs.
 * @param {string} markdown
 * @returns {string}
 */
export function normalizeCatalogMarkdown(markdown) {
  return markdown.replace(/^Generated: `[^`]+`/m, 'Generated: `<timestamp>`')
}

/**
 * @param {string} repoRoot
 * @returns {{ blocks: Record<string, AffordanceEntry>, primitives: Record<string, AffordanceEntry> }}
 */
export function loadAffordances(repoRoot) {
  const fullPath = path.join(repoRoot, AFFORDANCES_PATH)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing affordances file: ${AFFORDANCES_PATH}`)
  }
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
  } catch (err) {
    throw new Error(`Invalid JSON in ${AFFORDANCES_PATH}: ${err.message}`)
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`${AFFORDANCES_PATH} must be a JSON object`)
  }
  return {
    blocks: /** @type {Record<string, AffordanceEntry>} */ (parsed.blocks ?? {}),
    primitives: /** @type {Record<string, AffordanceEntry>} */ (parsed.primitives ?? {}),
  }
}

/**
 * @param {AffordanceEntry | undefined} entry
 * @param {string | null} schemaDescription
 * @returns {{ useCases: string[], avoidWhen: string[] }}
 */
function resolveAffordance(entry, schemaDescription) {
  const useCases = [...(entry?.useCases ?? [])]
  if (
    schemaDescription &&
    !useCases.some((u) => u.includes(schemaDescription.slice(0, 40)))
  ) {
    useCases.push(`Schema note: ${schemaDescription}`)
  }
  return {
    useCases,
    avoidWhen: [...(entry?.avoidWhen ?? [])],
  }
}

/**
 * @param {string} repoRoot
 * @returns {CatalogData}
 */
export function collectCatalogData(repoRoot) {
  const affordances = loadAffordances(repoRoot)
  const cmsPath = path.join(repoRoot, 'types/cms.ts')
  const cmsContent = fs.readFileSync(cmsPath, 'utf8')
  const cmsBlockTypes = [...parseCmsBlockTypes(cmsContent)].sort()
  const blocks = collectBlocks(repoRoot, cmsBlockTypes, affordances)
  const primitives = collectPrimitives(repoRoot, affordances)
  return {
    blocks,
    primitives,
    cmsBlockTypes,
    affordancesPath: AFFORDANCES_PATH,
    generatedAt: new Date().toISOString(),
    repoRoot,
  }
}

/**
 * @param {string} repoRoot
 * @param {string[]} cmsBlockTypes
 * @param {{ blocks: Record<string, AffordanceEntry>, primitives: Record<string, AffordanceEntry> }} affordances
 */
function collectBlocks(repoRoot, cmsBlockTypes, affordances) {
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
    const schemaMeta = schemaByType.get(blockType)
    const schemaPath = schemaMeta?.path ?? null
    const { useCases, avoidWhen } = resolveAffordance(
      affordances.blocks[blockType],
      schemaMeta?.description ?? null,
    )
    entries.push({
      blockType,
      componentModule,
      componentPath: toRepoRelative(repoRoot, componentPath),
      inCms: cmsTypes.has(blockType),
      schemaPath: schemaPath ? toRepoRelative(repoRoot, schemaPath) : null,
      schemaValid: schemaMeta?.valid ?? false,
      schemaDescription: schemaMeta?.description ?? null,
      useCases,
      avoidWhen,
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
 * @returns {Map<string, { path: string, valid: boolean, description: string | null }>}
 */
function loadSchemas(schemasDir) {
  /** @type {Map<string, { path: string, valid: boolean, description: string | null }>} */
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
      const description =
        typeof schema.description === 'string' ? schema.description : null
      byType.set(blockType, { path: fullPath, valid: true, description })
    } catch {
      byType.set(file.replace('.schema.json', ''), {
        path: fullPath,
        valid: false,
        description: null,
      })
    }
  }

  return byType
}

/**
 * @param {string} repoRoot
 * @param {{ blocks: Record<string, AffordanceEntry>, primitives: Record<string, AffordanceEntry> }} affordances
 * @returns {Record<string, PrimitiveEntry[]>}
 */
function collectPrimitives(repoRoot, affordances) {
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
        const key = `${category}/${name}`
        const storyPath = path.join(dir, `${name}.stories.tsx`)
        const internal = INTERNAL_PRIMITIVES.has(name)
        const { useCases, avoidWhen } = internal
          ? { useCases: [], avoidWhen: [] }
          : resolveAffordance(affordances.primitives[key], null)
        return {
          name,
          path: rel,
          key,
          storybook: fs.existsSync(storyPath)
            ? `${capitalize(category)}/${name}`
            : null,
          internal,
          useCases,
          avoidWhen,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    out[category] = entries
  }

  return out
}

/**
 * @param {string[]} useCases
 * @param {string[]} avoidWhen
 * @param {string[]} lines
 */
function appendAffordanceLines(useCases, avoidWhen, lines) {
  if (useCases.length > 0) {
    lines.push('- **Use when:**')
    for (const u of useCases) {
      lines.push(`  - ${u}`)
    }
  }
  if (avoidWhen.length > 0) {
    lines.push('- **Avoid when:**')
    for (const a of avoidWhen) {
      lines.push(`  - ${a}`)
    }
  }
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
    '> **Auto-generated.** Do not edit this file. Run `npm run generate:component-catalog` after changing `componentRegistry.ts`, `types/cms.ts`, `config/component-affordances.json`, block schemas, or primitive components.',
  )
  lines.push('')
  lines.push(`Generated: \`${data.generatedAt}\``)
  lines.push('')
  lines.push('## How to use this catalog')
  lines.push('')
  lines.push(
    '- **Tenant pages (CMS JSON):** pick blocks by `_type` below. Dispatch is via `components/componentRegistry.ts` → `PageRenderer`.',
  )
  lines.push(
    '- **When to use what:** each entry lists **Use when** / **Avoid when** from `config/component-affordances.json` (edit that file when adding components).',
  )
  lines.push(
    '- **New block:** `types/cms.ts`, `components/blocks/*.tsx`, `componentRegistry.ts`, schema, affordances entry, then `npm run generate:component-catalog`. See `docs/blocks.md`.',
  )
  lines.push(
    '- **Primitives:** build or extend blocks — not CMS `_type` values. Sections are usually wrapped by `*Block` components.',
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
  lines.push('')

  lines.push('## CMS blocks (quick reference)')
  lines.push('')
  lines.push('| _type | Summary | Schema |')
  lines.push('| --- | --- | --- |')
  for (const b of data.blocks) {
    const summary = b.useCases[0] ?? '_no affordances_'
    const schema = b.schemaPath ? 'yes' : 'no'
    lines.push(`| \`${b.blockType}\` | ${summary} | ${schema} |`)
  }
  lines.push('')

  lines.push('## CMS blocks (full affordances)')
  lines.push('')
  for (const b of data.blocks) {
    lines.push(`### \`${b.blockType}\``)
    lines.push('')
    lines.push(`- **Component:** \`${b.componentPath}\``)
    lines.push(`- **TypeScript (\`Block\` union):** ${b.inCms ? 'yes' : '**missing**'}`)
    lines.push(
      `- **JSON schema:** ${b.schemaPath ? `\`${b.schemaPath}\`` : '_missing_'}`,
    )
    appendAffordanceLines(b.useCases, b.avoidWhen, lines)
    lines.push('')
  }

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
    for (const p of items) {
      lines.push(`### \`${p.name}\``)
      lines.push('')
      lines.push(`- **Path:** \`${p.path}\``)
      lines.push(`- **Storybook:** ${p.storybook ? `\`${p.storybook}\`` : '—'}`)
      if (p.internal) {
        lines.push('- **Notes:** internal helper — no affordances required')
      } else if (category === 'sections') {
        lines.push('- **Notes:** prefer the matching CMS `*Block` in page JSON')
      }
      if (!p.internal) {
        appendAffordanceLines(p.useCases, p.avoidWhen, lines)
      }
      lines.push('')
    }
  }

  return `${lines.join('\n')}\n`
}

/**
 * @param {CatalogData} data
 * @returns {{ errors: string[], warnings: string[], schemaOrphans: string[] }}
 */
export function getCatalogHealth(data) {
  return computeHealth(data)
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
 * @returns {{ errors: string[], warnings: string[], schemaOrphans: string[] }}
 */
function computeHealth(data) {
  /** @type {string[]} */
  const errors = []
  /** @type {string[]} */
  const warnings = []
  /** @type {string[]} */
  const schemaOrphans = []

  const affordances = loadAffordances(data.repoRoot)
  const registryTypes = new Set(data.blocks.map((b) => b.blockType))
  const cmsTypes = new Set(data.cmsBlockTypes)
  const missingRegistry = [...cmsTypes].filter((t) => !registryTypes.has(t))

  for (const blockType of Object.keys(affordances.blocks)) {
    if (!registryTypes.has(blockType)) {
      errors.push(
        `Affordances blocks.${blockType} has no matching entry in componentRegistry.ts`,
      )
    }
  }

  /** @type {Set<string>} */
  const allPrimitiveKeys = new Set()
  for (const items of Object.values(data.primitives)) {
    for (const p of items) {
      allPrimitiveKeys.add(p.key)
      if (p.internal) continue
      if (!affordances.primitives[p.key]) {
        errors.push(`Missing primitives.${p.key} in ${AFFORDANCES_PATH}`)
      } else if (affordances.primitives[p.key].useCases?.length < 1) {
        errors.push(`primitives.${p.key} must have at least one useCases entry`)
      }
    }
  }
  for (const key of Object.keys(affordances.primitives)) {
    if (!allPrimitiveKeys.has(key)) {
      errors.push(
        `Affordances primitives.${key} has no matching component file`,
      )
    }
  }

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
    const aff = affordances.blocks[b.blockType]
    if (!aff) {
      errors.push(`Missing blocks.${b.blockType} in ${AFFORDANCES_PATH}`)
    } else if (!aff.useCases || aff.useCases.length < 1) {
      errors.push(`blocks.${b.blockType} must have at least one useCases entry`)
    }
    if (b.useCases.length < 1) {
      errors.push(`Block "${b.blockType}" has no resolved useCases for the catalog`)
    }
    if (!b.schemaPath) {
      errors.push(
        `Registry block "${b.blockType}" has no JSON schema in config/schemas/blocks/ (expected config/schemas/blocks/<_type>.schema.json or schema with matching properties._type.const)`,
      )
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
