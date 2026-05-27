import type { BookingSettings } from '@/types/cms'

export { guaranteePenaltyLabel, noShowPenaltyPercent } from '@/lib/no-show-penalty'

export function isGuaranteeRequired(settings?: BookingSettings | null): boolean {
  return settings?.enforceGuarantee === true
}
