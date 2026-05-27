import { beforeEach, describe, expect, it, vi } from 'vitest'

const profileReadMock = vi.hoisted(() => vi.fn())
const profileUpsertMock = vi.hoisted(() => vi.fn())
const reservationsQueryMock = vi.hoisted(() => vi.fn())

vi.mock('../../azure-functions/src/cosmos/clientProfileContainer', () => ({
  getClientProfileContainer: () => ({
    item: () => ({ read: profileReadMock }),
    items: { upsert: profileUpsertMock },
  }),
}))

vi.mock('../../azure-functions/src/cosmos/adminDb', () => ({
  getReservationsContainer: () => ({
    items: {
      query: () => ({ fetchAll: reservationsQueryMock }),
    },
  }),
}))

import {
  DEFAULT_TENANT_BOOKING_SETTINGS,
  ensureTenantBookingSettings,
  readTenantBookingSettings,
  resolveTenantBookingSettings,
} from '../../azure-functions/src/cosmos/tenantSettingsStore'

describe('tenantSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileUpsertMock.mockResolvedValue(undefined)
  })

  describe('readTenantBookingSettings', () => {
    it('returns booking settings when the Cosmos document exists', async () => {
      profileReadMock.mockResolvedValue({
        resource: {
          clientId: 'salon-a',
          bookingSettings: { enforceGuarantee: true, cancellationFeePercent: 40, currency: 'USD' },
        },
      })

      await expect(readTenantBookingSettings('salon-a')).resolves.toEqual({
        enforceGuarantee: true,
        cancellationFeePercent: 40,
        currency: 'USD',
      })
    })

    it('returns null when the Cosmos document is missing', async () => {
      profileReadMock.mockRejectedValue({ code: 404 })

      await expect(readTenantBookingSettings('salon-a')).resolves.toBeNull()
    })
  })

  describe('ensureTenantBookingSettings', () => {
    it('returns existing settings without upserting', async () => {
      profileReadMock.mockResolvedValue({
        resource: {
          clientId: 'salon-a',
          bookingSettings: { enforceGuarantee: false },
        },
      })

      await expect(
        ensureTenantBookingSettings('salon-a', DEFAULT_TENANT_BOOKING_SETTINGS),
      ).resolves.toEqual({ enforceGuarantee: false })

      expect(profileUpsertMock).not.toHaveBeenCalled()
    })

    it('upserts settings when the document is missing', async () => {
      profileReadMock.mockRejectedValue({ code: 404 })

      await expect(
        ensureTenantBookingSettings('salon-a', DEFAULT_TENANT_BOOKING_SETTINGS),
      ).resolves.toEqual(DEFAULT_TENANT_BOOKING_SETTINGS)

      expect(profileUpsertMock).toHaveBeenCalledWith({
        id: 'salon-a-settings',
        clientId: 'salon-a',
        bookingSettings: DEFAULT_TENANT_BOOKING_SETTINGS,
      })
    })
  })

  describe('resolveTenantBookingSettings', () => {
    it('returns stored settings when present', async () => {
      profileReadMock.mockResolvedValue({
        resource: {
          clientId: 'salon-a',
          bookingSettings: { enforceGuarantee: true, cancellationFeePercent: 30, currency: 'GBP' },
        },
      })

      await expect(resolveTenantBookingSettings('salon-a')).resolves.toEqual({
        enforceGuarantee: true,
        cancellationFeePercent: 30,
        currency: 'GBP',
      })

      expect(reservationsQueryMock).not.toHaveBeenCalled()
    })

    it('returns null when settings and card-on-file reservations are both missing', async () => {
      profileReadMock.mockRejectedValue({ code: 404 })
      reservationsQueryMock.mockResolvedValue({ resources: [] })

      await expect(resolveTenantBookingSettings('salon-a')).resolves.toBeNull()
      expect(profileUpsertMock).not.toHaveBeenCalled()
    })

    it('backfills default settings when card-on-file reservations exist', async () => {
      profileReadMock
        .mockRejectedValueOnce({ code: 404 })
        .mockRejectedValueOnce({ code: 404 })
      reservationsQueryMock.mockResolvedValue({ resources: [{ id: 'res-1' }] })

      await expect(resolveTenantBookingSettings('salon-a')).resolves.toEqual(
        DEFAULT_TENANT_BOOKING_SETTINGS,
      )

      expect(profileUpsertMock).toHaveBeenCalledWith({
        id: 'salon-a-settings',
        clientId: 'salon-a',
        bookingSettings: DEFAULT_TENANT_BOOKING_SETTINGS,
      })
    })
  })
})
