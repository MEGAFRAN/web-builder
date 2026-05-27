import { promises as fs } from 'fs'
import path from 'path'

const LOCAL_FILE = path.join(process.cwd(), 'data', 'stripe-connect-local.json')

type StoredStripeConnect = {
  clientId?: string
  stripeAccountId: string | null
}

export async function readStripeAccountId(): Promise<string | null> {
  try {
    const raw = await fs.readFile(LOCAL_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as StoredStripeConnect
    const envClientId = process.env.CLIENT_ID
    if (
      parsed.clientId &&
      envClientId &&
      parsed.clientId !== envClientId
    ) {
      return null
    }
    return typeof parsed.stripeAccountId === 'string' ? parsed.stripeAccountId : null
  } catch {
    return null
  }
}

export async function writeStripeAccountId(accountId: string | null): Promise<void> {
  const clientId = process.env.CLIENT_ID
  const payload: StoredStripeConnect = {
    ...(clientId ? { clientId } : {}),
    stripeAccountId: accountId,
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
  await fs.writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2))
}
