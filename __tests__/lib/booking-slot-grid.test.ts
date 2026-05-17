// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { BOOKING_SLOT_GRID } from '@/lib/booking-slot-grid'

describe('booking-slot-grid', () => {
  it('exports a non-empty ordered slot grid', () => {
    expect(BOOKING_SLOT_GRID.length).toBeGreaterThan(0)
    expect(BOOKING_SLOT_GRID[0]).toBe('09:00')
    expect(BOOKING_SLOT_GRID.at(-1)).toBe('21:00')
  })
})
