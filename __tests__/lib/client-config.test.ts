// @vitest-environment node
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getClientConfig } from '@/lib/client-config'

describe('getClientConfig (integration)', () => {
  it('loads restaurante-pepe and returns resolved theme with all 6 fields', () => {
    const config = getClientConfig('restaurante-pepe')
    expect(config.clientId).toBe('restaurante-pepe')
    expect(config.displayName).toBe('Restaurante Pepe')
    // Resolved from bold-restaurant preset
    expect(config.theme.primaryColor).toBe('#c0392b')
    expect(config.theme.accentColor).toBeDefined()
    expect(config.theme.backgroundColor).toBeDefined()
    expect(config.theme.fontHeading).toBeDefined()
    expect(config.theme.fontBody).toBeDefined()
    expect(typeof config.theme.borderRadius).toBe('number')
    // preset key must be stripped from resolved theme
    expect(config.theme).not.toHaveProperty('preset')
  })

  it('throws when clientId does not exist', () => {
    expect(() => getClientConfig('nonexistent-client')).toThrow()
  })
})

describe('getClientConfig template filesystem edge cases', () => {
  let tmpRoot: string
  let prevCwd: string

  const minimalClient = (templateName: string) => ({
    clientId: 'tmp-client',
    displayName: 'Tmp Client',
    customDomain: 'tmp.example',
    swaResourceName: 'sw-tmp',
    template: templateName,
    features: {},
    theme: { preset: 'default' as const },
  })

  beforeEach(() => {
    prevCwd = process.cwd()
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-client-config-'))
    process.chdir(tmpRoot)
    fs.mkdirSync(path.join(tmpRoot, 'config', 'clients', 'tmp-client'), { recursive: true })
  })

  afterEach(() => {
    process.chdir(prevCwd)
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  })

  it('warns when template.json is missing but continues with empty template pages', () => {
    const templateDir = path.join(tmpRoot, 'config', 'templates', 'no-template-json')
    fs.mkdirSync(templateDir, { recursive: true })

    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'clients', 'tmp-client', 'client.json'),
      JSON.stringify(minimalClient('no-template-json')),
      'utf-8',
    )

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config = getClientConfig('tmp-client')

    expect(warn.mock.calls.some(([msg]) => typeof msg === 'string' && msg.includes('template.json'))).toBe(true)
    expect(config.pages).toEqual([])
    warn.mockRestore()
  })

  it('warns when template pages directory is missing', () => {
    const templateName = 'meta-without-pages'
    fs.mkdirSync(path.join(tmpRoot, 'config', 'templates', templateName), { recursive: true })
    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'templates', templateName, 'template.json'),
      '{}',
      'utf-8',
    )

    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'clients', 'tmp-client', 'client.json'),
      JSON.stringify(minimalClient(templateName)),
      'utf-8',
    )

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config = getClientConfig('tmp-client')

    expect(warn.mock.calls.some(([msg]) => typeof msg === 'string' && msg.includes('pages directory'))).toBe(true)
    expect(config.pages).toEqual([])
    warn.mockRestore()
  })

  it('loads JSON pages from nested directories into dotted slugs', () => {
    const pagesDir = path.join(tmpRoot, 'config', 'clients', 'tmp-client', 'pages')
    fs.mkdirSync(path.join(pagesDir, 'success-cases'), { recursive: true })
    fs.writeFileSync(
      path.join(pagesDir, 'success-cases', 'acme.json'),
      JSON.stringify({ metadata: null, blocks: [] }),
      'utf-8',
    )

    fs.mkdirSync(path.join(pagesDir, 'a', 'b'), { recursive: true })
    fs.writeFileSync(
      path.join(pagesDir, 'a', 'b', 'deep.json'),
      JSON.stringify({ metadata: null, blocks: [] }),
      'utf-8',
    )

    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'clients', 'tmp-client', 'client.json'),
      JSON.stringify({ ...minimalClient('meta-without-pages'), template: undefined }),
      'utf-8',
    )

    const config = getClientConfig('tmp-client')

    expect(config.pages.some((p) => p.slug === 'success-cases/acme')).toBe(true)
    expect(config.pages.some((p) => p.slug === 'a/b/deep')).toBe(true)
  })

  it('ignores non-JSON files when collecting pages', () => {
    const pagesDir = path.join(tmpRoot, 'config', 'clients', 'tmp-client', 'pages')
    fs.mkdirSync(pagesDir, { recursive: true })
    fs.writeFileSync(path.join(pagesDir, 'ignored.txt'), 'nope', 'utf-8')
    fs.writeFileSync(
      path.join(pagesDir, 'keep.json'),
      JSON.stringify({ metadata: null, blocks: [] }),
      'utf-8',
    )

    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'clients', 'tmp-client', 'client.json'),
      JSON.stringify({ ...minimalClient('meta-without-pages'), template: undefined }),
      'utf-8',
    )

    const config = getClientConfig('tmp-client')
    expect(config.pages.some((p) => p.slug === 'keep')).toBe(true)
    expect(config.pages.some((p) => p.slug === 'ignored')).toBe(false)
  })

  it('uses template bottomActionBar when client omits the key', () => {
    const templateName = 'tpl-with-bottom-bar'
    fs.mkdirSync(path.join(tmpRoot, 'config', 'templates', templateName), { recursive: true })
    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'templates', templateName, 'template.json'),
      JSON.stringify({
        bottomActionBar: {
          items: [{ label: 'From template', href: '/t' }],
        },
      }),
      'utf-8',
    )
    fs.mkdirSync(path.join(tmpRoot, 'config', 'templates', templateName, 'pages'), { recursive: true })

    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'clients', 'tmp-client', 'client.json'),
      JSON.stringify(minimalClient(templateName)),
      'utf-8',
    )

    const config = getClientConfig('tmp-client')
    expect(config.bottomActionBar?.items[0]?.label).toBe('From template')
  })

  it('clears bottomActionBar when client.json sets it to null', () => {
    const templateName = 'tpl-with-bottom-bar-null'
    fs.mkdirSync(path.join(tmpRoot, 'config', 'templates', templateName), { recursive: true })
    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'templates', templateName, 'template.json'),
      JSON.stringify({
        bottomActionBar: {
          items: [{ label: 'Template bar', href: '/t' }],
        },
      }),
      'utf-8',
    )
    fs.mkdirSync(path.join(tmpRoot, 'config', 'templates', templateName, 'pages'), { recursive: true })

    fs.writeFileSync(
      path.join(tmpRoot, 'config', 'clients', 'tmp-client', 'client.json'),
      JSON.stringify({
        ...minimalClient(templateName),
        bottomActionBar: null,
      }),
      'utf-8',
    )

    expect(getClientConfig('tmp-client').bottomActionBar).toBeNull()
  })
})
