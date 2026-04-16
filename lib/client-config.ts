import fs from 'fs'
import path from 'path'
import type { ClientConfig, ClientPage, Block, ClientTheme, ClientHeader, ClientFooter, PageMetadata, PageInset } from '@/types/cms'
import { THEME_PRESETS, getPreset } from '@/lib/theme-presets'
import type { ThemePreset } from '@/lib/theme-presets'

/**
 * Resolves a `PageInset` value (string or responsive object) to a plain CSS string.
 * - String values are passed through unchanged.
 * - Responsive objects with `mobile` and `desktop` are converted to a `clamp()` expression
 *   that smoothly interpolates between the two values across the 320px–1280px viewport range.
 *   The optional `tablet` breakpoint is accepted but not currently used in the clamp formula.
 */
export function resolvePageInset(value: PageInset): string {
  if (typeof value === 'string') return value
  return buildClamp(value.mobile, value.desktop)
}

function buildClamp(min: string, max: string): string {
  return `clamp(${min}, calc(${min} + (${stripUnit(max)} - ${stripUnit(min)}) * ((100vw - 320px) / (1280 - 320))), ${max})`
}

function stripUnit(value: string): number {
  return parseFloat(value)
}

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
    pageInset: resolvePageInset(explicitFields.pageInset ?? base.pageInset),
    sectionSpacing: resolvePageInset(explicitFields.sectionSpacing ?? base.sectionSpacing),
    contentGap: resolvePageInset(explicitFields.contentGap ?? base.contentGap),
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

/**
 * Merges template pages with client-specific pages.
 * Client pages override template pages by slug — last writer wins.
 */
export function mergeTemplatePages(
  templatePages: ClientPage[],
  clientPages: ClientPage[]
): ClientPage[] {
  const map = new Map<string, ClientPage>()
  for (const page of templatePages) map.set(page.slug, page)
  for (const page of clientPages) map.set(page.slug, page)
  return Array.from(map.values())
}

type TemplateMeta = {
  templateId?: string
  displayName?: string
  description?: string
  defaultThemePreset?: string
  defaultFeatures?: Record<string, boolean>
  header?: ClientHeader | null
  footer?: ClientFooter | null
}

/**
 * Loads and returns the parsed `template.json` for a given template name.
 * Returns `null` if the file does not exist.
 */
function loadTemplateMeta(templateName: string): TemplateMeta | null {
  const templateJsonPath = path.join(
    process.cwd(), 'config', 'templates', templateName, 'template.json'
  )
  if (!fs.existsSync(templateJsonPath)) {
    console.warn(
      `[client-config] Template "${templateName}" has no template.json at ${templateJsonPath}`
    )
    return null
  }
  const raw = fs.readFileSync(templateJsonPath, 'utf-8')
  return JSON.parse(raw) as TemplateMeta
}

function loadTemplatePages(templateName: string): ClientPage[] {
  const templatePagesDir = path.join(
    process.cwd(), 'config', 'templates', templateName, 'pages'
  )
  if (!fs.existsSync(templatePagesDir)) {
    console.warn(
      `[client-config] Template "${templateName}" has no pages directory at ${templatePagesDir}`
    )
    return []
  }
  return loadPagesFromDirectory(templatePagesDir)
}

export function getClientConfig(clientId: string): ClientConfig {
  const clientDir = path.join(process.cwd(), 'config', 'clients', clientId)
  const clientJsonPath = path.join(clientDir, 'client.json')

    const rawText = fs.readFileSync(clientJsonPath, 'utf-8')
    const base = JSON.parse(rawText) as Omit<ClientConfig, 'pages'>

    const pagesDir = path.join(clientDir, 'pages')
    const clientPages: ClientPage[] = fs.existsSync(pagesDir)
      ? loadPagesFromDirectory(pagesDir)
      : []

    let pages: ClientPage[]
    let templateHeader: ClientHeader | null = null
    let templateFooter: ClientFooter | null = null

    if (base.template) {
      const templateMeta = loadTemplateMeta(base.template)
      if (templateMeta) {
        templateHeader = templateMeta.header ?? null
        templateFooter = templateMeta.footer ?? null
      }
      pages = mergeTemplatePages(loadTemplatePages(base.template), clientPages)
    } else {
      pages = clientPages
    }

    const resolvedHeader: ClientHeader | null | undefined =
      base.header ?? templateHeader ?? null
    const resolvedFooter: ClientFooter | null | undefined =
      base.footer ?? templateFooter ?? null

    const resolvedTheme = resolveTheme(base.theme)
    return { ...base, theme: resolvedTheme, pages, header: resolvedHeader, footer: resolvedFooter }
}
