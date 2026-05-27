import { getClientProfileContainer } from './clientProfileContainer'

type StripeConnectDocument = {
  id: string
  clientId: string
  stripeAccountId: string | null
}

const docId = (clientId: string) => `${clientId}-stripe`

export async function readStripeAccountId(clientId: string): Promise<string | null> {
  const container = getClientProfileContainer()
  try {
    const { resource } = await container
      .item(docId(clientId), clientId)
      .read<StripeConnectDocument>()
    if (!resource || resource.clientId !== clientId) return null
    return typeof resource.stripeAccountId === 'string' ? resource.stripeAccountId : null
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404) return null
    throw err
  }
}

export async function writeStripeAccountId(
  clientId: string,
  stripeAccountId: string | null,
): Promise<void> {
  const container = getClientProfileContainer()
  const doc: StripeConnectDocument = {
    id: docId(clientId),
    clientId,
    stripeAccountId,
  }
  await container.items.upsert(doc)
}
