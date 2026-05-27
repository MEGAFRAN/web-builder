import type { ReservationGuarantee } from '@/types/admin'

export function parseGuaranteePayload(body: Record<string, unknown>): ReservationGuarantee | null {
  const paymentMethodId = body.paymentMethodId
  const customerId = body.customerId
  if (typeof paymentMethodId !== 'string' || paymentMethodId.trim().length === 0) {
    return null
  }
  const guarantee: ReservationGuarantee = {
    paymentMethodId: paymentMethodId.trim(),
    status: 'vaulted',
  }
  if (typeof customerId === 'string' && customerId.trim().length > 0) {
    guarantee.customerId = customerId.trim()
  }
  return guarantee
}
