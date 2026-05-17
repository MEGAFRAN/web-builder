import { promises as fs } from 'fs'
import path from 'path'
import type { AdminBookingService } from '@/types/admin'

const SERVICES_PATH = path.join(process.cwd(), 'data', 'booking-services-local.json')

export async function readBookingServices(): Promise<AdminBookingService[]> {
  try {
    const raw = await fs.readFile(SERVICES_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return []
    const services = (parsed as { services?: unknown }).services
    return Array.isArray(services) ? (services as AdminBookingService[]) : []
  } catch {
    return []
  }
}

export async function writeBookingServices(services: AdminBookingService[]): Promise<void> {
  await fs.writeFile(SERVICES_PATH, JSON.stringify({ services }, null, 2))
}
