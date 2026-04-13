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

/**
 * Derives a page slug from a filename.
 * "index.json" → "" (home page)
 * "menu.json"  → "menu"
 */
function slugFromFilename(filename: string): string {
  const base = path.basename(filename, '.json')
  return base === 'index' ? '' : base
}

type RawPageFile = { metadata?: PageMetadata | null; blocks: Block[] }

/**
 * Loads pages from `config/clients/{clientId}/pages/` directory.
 * Each JSON file must be an object with `metadata` and `blocks` fields.
 */
function loadPagesFromDirectory(pagesDir: string): ClientPage[] {
  const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.json'))
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(pagesDir, filename), 'utf-8')
    const parsed = JSON.parse(raw) as RawPageFile
    return {
      slug: slugFromFilename(filename),
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
