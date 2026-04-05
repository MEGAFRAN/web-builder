import fs from 'fs'
import path from 'path'
import type { ClientConfig, ClientPage, Block } from '@/types/cms'

/**
 * Derives a page slug from a filename.
 * "index.json" → "" (home page)
 * "menu.json"  → "menu"
 */
function slugFromFilename(filename: string): string {
  const base = path.basename(filename, '.json')
  return base === 'index' ? '' : base
}

/**
 * Loads pages from `config/clients/{clientId}/pages/` directory.
 * Each JSON file is an array of Block objects.
 */
function loadPagesFromDirectory(pagesDir: string): ClientPage[] {
  const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.json'))
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(pagesDir, filename), 'utf-8')
    const blocks = JSON.parse(raw) as Block[]
    return { slug: slugFromFilename(filename), blocks }
  })
}

export function getClientConfig(clientId: string): ClientConfig {
  const clientDir = path.join(process.cwd(), 'config', 'clients', clientId)
  const clientJsonPath = path.join(clientDir, 'client.json')

  // New directory-based structure: config/clients/{clientId}/client.json
  if (fs.existsSync(clientJsonPath)) {
    const raw = fs.readFileSync(clientJsonPath, 'utf-8')
    const base = JSON.parse(raw) as Omit<ClientConfig, 'pages'>

    const pagesDir = path.join(clientDir, 'pages')
    const pages: ClientPage[] = fs.existsSync(pagesDir)
      ? loadPagesFromDirectory(pagesDir)
      : []

    return { ...base, pages }
  }

  // Legacy flat-file structure: config/clients/{clientId}.json
  const legacyPath = path.join(process.cwd(), 'config', 'clients', `${clientId}.json`)
  const raw = fs.readFileSync(legacyPath, 'utf-8')
  return JSON.parse(raw) as ClientConfig
}
