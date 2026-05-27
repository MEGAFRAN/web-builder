import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HttpRequest, InvocationContext } from '@azure/functions'

const ensureTenantBookingSettingsMock = vi.hoisted(() => vi.fn())
const createAdminReservationMock = vi.hoisted(() => vi.fn())

vi.mock('../../azure-functions/src/cosmos/tenantSettingsStore', () => ({
  DEFAULT_TENANT_BOOKING_SETTINGS: {
    enforceGuarantee: true,
    cancellationFeePercent: 50,
    currency: 'EUR',
  },
  ensureTenantBookingSettings: ensureTenantBookingSettingsMock,
}))

vi.mock('../../azure-functions/src/cosmos/adminDb', () => ({
  createReservation: createAdminReservationMock,
}))

import { createReservationHandler } from '../../azure-functions/src/functions/createReservation'

function postRequest(body: unknown): HttpRequest {
  return {
    method: 'POST',
    headers: { get: () => null },
    query: new URLSearchParams(),
    params: {},
    user: null,
    body: null,
    bodyUsed: false,
    json: async () => body,
  } as unknown as HttpRequest
}

const mockContext = { log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as InvocationContext

const validPayload = {
  clientId: 'salon-a',
  serviceId: 'svc-1',
  durationMinutes: 60,
  name: 'Jordan',
  email: 'jordan@example.com',
  phone: '+1 415 555 0100',
  date: '2026-05-27',
  time: '21:00',
}

describe('POST /reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ensureTenantBookingSettingsMock.mockResolvedValue({
      enforceGuarantee: true,
      cancellationFeePercent: 50,
      currency: 'EUR',
    })
    createAdminReservationMock.mockResolvedValue(undefined)
  })

  it('ensures tenant booking settings when a card guarantee is submitted', async () => {
    const res = await createReservationHandler(
      postRequest({ ...validPayload, paymentMethodId: 'pm_123' }),
      mockContext,
    )

    expect(res.status).toBe(201)
    expect(ensureTenantBookingSettingsMock).toHaveBeenCalledWith('salon-a', {
      enforceGuarantee: true,
      cancellationFeePercent: 50,
      currency: 'EUR',
    })
    expect(createAdminReservationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'salon-a',
        guarantee: { paymentMethodId: 'pm_123', status: 'vaulted' },
      }),
    )
  })

  it('does not ensure tenant booking settings when no card is submitted', async () => {
    const res = await createReservationHandler(postRequest(validPayload), mockContext)

    expect(res.status).toBe(201)
    expect(ensureTenantBookingSettingsMock).not.toHaveBeenCalled()
    expect(createAdminReservationMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        guarantee: expect.anything(),
      }),
    )
  })
})
