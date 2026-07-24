import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  dateFromTimestamp,
  isValidTelemetryPayload,
} from '../lib/telemetryPayload'

describe('telemetry payload validation', () => {
  it('accepts a valid payload', () => {
    assert.equal(
      isValidTelemetryPayload({
        site_id: 'tenant-1',
        event_type: 'click_phone',
        timestamp: '2026-07-24T12:00:00.000Z',
      }),
      true,
    )
  })

  it('rejects missing or invalid fields', () => {
    assert.equal(isValidTelemetryPayload({ site_id: 'tenant-1' }), false)
    assert.equal(
      isValidTelemetryPayload({
        site_id: 'tenant-1',
        event_type: 'click_mail',
        timestamp: '2026-07-24T12:00:00.000Z',
      }),
      false,
    )
  })

  it('derives UTC date buckets from timestamp', () => {
    assert.equal(dateFromTimestamp('2026-07-24T23:59:59.000Z'), '2026-07-24')
  })

  it('handler source does not read IP or User-Agent headers', () => {
    const source = readFileSync(join(__dirname, '../functions/telemetry.js'), 'utf8')
    assert.doesNotMatch(source, /x-forwarded-for/i)
    assert.doesNotMatch(source, /user-agent/i)
  })
})
