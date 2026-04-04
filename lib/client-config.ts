import fs from 'fs'
import path from 'path'
import type { ClientConfig } from '@/types/cms'

export function getClientConfig(clientId: string): ClientConfig {
  const configPath = path.join(process.cwd(), 'config', 'clients', `${clientId}.json`)
  const raw = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(raw) as ClientConfig
}
