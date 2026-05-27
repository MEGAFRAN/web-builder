// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HttpRequest, InvocationContext } from '@azure/functions'

const validateAdminJwtMock = vi.hoisted(() => vi.fn())
const getReservationByIdMock = vi.hoisted(() => vi.fn())
const getServicesMock = vi.hoisted(() => vi.fn())
const updateReservationByIdMock = vi.hoisted(() => vi.fn())
const readStripeAccountIdMock = vi.hoisted(() => vi.fn())
const resolveTenantBookingSettingsMock = vi.hoisted(() => vi.fn())
const chargeNoShowStripeMock = vi.hoisted(() => vi.fn())

vi.mock('../../azure-functions/src/auth/validateAdminJwt', () => ({
  validateAdminJwt: validateAdminJwtMock,
}))

vi.mock('../../azure-functions/src/cosmos/adminDb', () => ({
  getReservationById: getReservationByIdMock,
  getServices: getServicesMock,
  updateReservationById: updateReservationByIdMock,
}))

vi.mock('../../azure-functions/src/cosmos/stripeConnectStore', () => ({
  readStripeAccountId: readStripeAccountIdMock,
}))

vi.mock('../../azure-functions/src/cosmos/tenantSettingsStore', () => ({
  resolveTenantBookingSettings: resolveTenantBookingSettingsMock,
}))

vi.mock('../../azure-functions/src/lib/chargeNoShow', () => ({
  chargeNoShowStripe: chargeNoShowStripeMock,
}))

import { chargeNoShowHandler } from '../../azure-functions/src/functions/admin/chargeNoShow'
import type { StoredReservation } from '../../azure-functions/src/types/admin'

function postRequest(body: unknown, origin = 'https://admin.example.com'): HttpRequest {
  return {
    method: 'POST',
    headers: { get: (name: string) => (name.toLowerCase() === 'origin' ? origin : null) },
    query: new URLSearchParams(),
    params: {},
    user: null,
    body: null,
    bodyUsed: false,
    json: async () => body,
  } as unknown as HttpRequest
}

const mockContext = { log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as InvocationContext

const reservation: StoredReservation = {
  id: 'res-1',
  clientId: 'client-x',
  serviceId: 'cut',
  name: 'Ada',
  email: 'ada@example.com',
  phone: '+1',
  date: '2026-05-06',
  time: '09:00',
  status: 'no-show',
  createdAt: '2026-01-01',
  guarantee: {
    paymentMethodId: 'pm_123',
    customerId: 'cus_123',
    status: 'vaulted' as const,
  },
}

describe('POST /mgmt/charge-noshow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    validateAdminJwtMock.mockResolvedValue({ email: 'owner@example.com', clientId: 'client-x' })
    resolveTenantBookingSettingsMock.mockResolvedValue({
      enforceGuarantee: true,
      cancellationFeePercent: 50,
      currency: 'EUR',
    })
    readStripeAccountIdMock.mockResolvedValue('acct_123')
    getReservationByIdMock.mockResolvedValue(reservation)
    getServicesMock.mockResolvedValue([
      { id: 'cut', name: 'Cut', description: '', price: 100, durationMinutes: 60, currency: '€' },
    ])
    updateReservationByIdMock.mockImplementation(
      async (_id: string, _clientId: string, updater: (row: typeof reservation) => typeof reservation) =>
        updater(reservation),
    )
    chargeNoShowStripeMock.mockResolvedValue({ ok: true, status: 'cancelled_and_charged' })
  })

  it('returns 422 when the reservation is missing customerId', async () => {
    getReservationByIdMock.mockResolvedValueOnce({
      ...reservation,
      guarantee: { paymentMethodId: 'pm_123', status: 'vaulted' },
    })

    const res = await chargeNoShowHandler(
      postRequest({ reservationId: 'res-1' }),
      mockContext,
    )

    expect(res.status).toBe(422)
    expect(res.jsonBody).toEqual({
      error:
        'This reservation is missing the Stripe customer ID. The guest must re-book with a card on file.',
    })
    expect(chargeNoShowStripeMock).not.toHaveBeenCalled()
  })

  it('charges with euro ISO currency when the service catalog stores €', async () => {
    const res = await chargeNoShowHandler(
      postRequest({ reservationId: 'res-1' }),
      mockContext,
    )

    expect(res.status).toBe(200)
    expect(res.jsonBody).toEqual({
      ok: true,
      reservation: { ...reservation, status: 'cancelled_and_charged' },
    })
    expect(chargeNoShowStripeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethodId: 'pm_123',
        customerId: 'cus_123',
        currency: 'eur',
        amount: 50,
      }),
    )
  })

  it('returns 402 and persists the charge failure on the reservation', async () => {
    chargeNoShowStripeMock.mockResolvedValueOnce({
      ok: false,
      status: 'cancelled_charge_failed',
      error: 'Your card was declined.',
    })
    updateReservationByIdMock.mockImplementationOnce(
      async (_id: string, _clientId: string, updater: (row: typeof reservation) => typeof reservation) =>
        updater({
          ...reservation,
          status: 'cancelled_charge_failed',
          cancelReason: 'Your card was declined.',
        }),
    )

    const res = await chargeNoShowHandler(
      postRequest({ reservationId: 'res-1' }),
      mockContext,
    )

    expect(res.status).toBe(402)
    expect(res.jsonBody).toMatchObject({
      error: 'Your card was declined.',
      reservation: {
        id: 'res-1',
        status: 'cancelled_charge_failed',
        cancelReason: 'Your card was declined.',
      },
    })
  })
})
