import type { ReservationRow } from '@/types/admin'

export const storyClientId = 'storybook-client'

export function mockReservation(overrides: Partial<ReservationRow> = {}): ReservationRow {
  return {
    id: 'res-1',
    clientId: storyClientId,
    serviceId: 'svc-cut',
    serviceName: 'Haircut',
    durationMinutes: 45,
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    phone: '+1 415 555 0100',
    date: '2026-05-18',
    time: '10:00',
    notes: 'Allergic to certain dyes.',
    status: 'confirmed',
    createdAt: '2026-05-18T08:00:00.000Z',
    ...overrides,
  }
}
