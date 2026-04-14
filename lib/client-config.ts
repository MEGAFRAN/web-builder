import fs from 'fs'
import path from 'path'
import type { ClientConfig, ClientPage, Block, ClientTheme, PageMetadata } from '@/types/cms'
import { THEME_PRESETS, getPreset } from '@/lib/theme-presets'
import type { ThemePreset } from '@/lib/theme-presets'

/**
 * Resolves a raw ClientTheme (which may contain a `preset` key and/or partial
 * explicit fields) into a fully-specified ThemePreset with no `preset` key.
 *
 * Resolution order: preset base → client explicit overrides (shallow merge).
 * If no preset is specified and any of the 6 fields are missing, the "default"
 * preset fills the gaps.
 */
export function resolveTheme(raw: ClientTheme): ThemePreset {
  const { preset: presetName, ...explicitFields } = raw

  let base: ThemePreset

  if (presetName !== undefined) {
    const found = getPreset(presetName)
    if (!found) {
      console.warn(
        `[client-config] Unknown theme preset "${presetName}". Falling back to "default".`
      )
      base = THEME_PRESETS['default']
    } else {
      base = found
    }
  } else {
    // No preset specified — use "default" as fallback for any missing fields.
    base = THEME_PRESETS['default']
  }

  return {
    primaryColor: explicitFields.primaryColor ?? base.primaryColor,
    accentColor: explicitFields.accentColor ?? base.accentColor,
    backgroundColor: explicitFields.backgroundColor ?? base.backgroundColor,
    textColor: explicitFields.textColor ?? base.textColor,
    surfaceColor: explicitFields.surfaceColor ?? base.surfaceColor,
    surfaceDark: explicitFields.surfaceDark ?? base.surfaceDark,
    fontHeading: explicitFields.fontHeading ?? base.fontHeading,
    fontBody: explicitFields.fontBody ?? base.fontBody,
    borderRadius: explicitFields.borderRadius ?? base.borderRadius,
  }
}

type RawPageFile = { metadata?: PageMetadata | null; blocks: Block[] }

/**
 * Recursively collects all JSON files under a directory, returning their
 * absolute path and relative slug prefix.
 *
 * Example: pages/success-cases/abercrombie-fitch.json → slug "success-cases/abercrombie-fitch"
 *          pages/index.json → slug ""
 *          pages/menu.json  → slug "menu"
 */
function collectJsonFiles(
  dir: string,
  prefix: string = ''
): Array<{ filePath: string; slug: string }> {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const result: Array<{ filePath: string; slug: string }> = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      const subPrefix = prefix ? `${prefix}/${entry.name}` : entry.name
      result.push(...collectJsonFiles(fullPath, subPrefix))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const base = path.basename(entry.name, '.json')
      const slug =
        base === 'index'
          ? prefix
          : prefix
          ? `${prefix}/${base}`
          : base
      result.push({ filePath: fullPath, slug })
    }
  }

  return result
}

/**
 * Loads pages from `config/clients/{clientId}/pages/` directory recursively.
 * Subdirectory structure maps to nested slugs:
 *   pages/success-cases/abercrombie-fitch.json → slug "success-cases/abercrombie-fitch"
 * Each JSON file must be an object with `metadata` and `blocks` fields.
 */
function loadPagesFromDirectory(pagesDir: string): ClientPage[] {
  const files = collectJsonFiles(pagesDir)
  return files.map(({ filePath, slug }) => {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as RawPageFile
    return {
      slug,
      blocks: parsed.blocks,
      metadata: parsed.metadata ?? null,
    }
  })
}

export function getClientConfig(clientId: string): ClientConfig {
  const clientDir = path.join(process.cwd(), 'config', 'clients', clientId)
  const clientJsonPath = path.join(clientDir, 'client.json')

  // New directory-based structure: config/clients/{clientId}/client.json
  if (fs.existsSync(clientJsonPath)) {
    const rawText = fs.readFileSync(clientJsonPath, 'utf-8')
    const base = JSON.parse(rawText) as Omit<ClientConfig, 'pages'>

    const pagesDir = path.join(clientDir, 'pages')
    const pages: ClientPage[] = fs.existsSync(pagesDir)
      ? loadPagesFromDirectory(pagesDir)
      : []

    const resolvedTheme = resolveTheme(base.theme)
    return { ...base, theme: resolvedTheme, pages }
  }

  // Legacy flat-file structure: config/clients/{clientId}.json
  const legacyPath = path.join(process.cwd(), 'config', 'clients', `${clientId}.json`)
  const rawText = fs.readFileSync(legacyPath, 'utf-8')
  const legacy = JSON.parse(rawText) as ClientConfig
  const resolvedTheme = resolveTheme(legacy.theme)
  return { ...legacy, theme: resolvedTheme }
}
