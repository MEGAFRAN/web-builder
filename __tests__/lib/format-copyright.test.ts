import { describe, it, expect } from 'vitest'
import { formatCopyright } from '@/lib/format-copyright'

describe('formatCopyright', () => {
  it('replaces an embedded year after the copyright symbol', () => {
    expect(formatCopyright('© 2025 Acme', 2026)).toBe('© 2026 Acme')
  })

  it('prefixes the current year when none is present', () => {
    expect(formatCopyright('Acme Corp. All rights reserved.', 2026)).toBe(
      '© 2026 Acme Corp. All rights reserved.',
    )
  })

  it('returns empty text unchanged', () => {
    expect(formatCopyright('   ', 2026)).toBe('')
  })
})
