// @vitest-environment node
import { describe, it, expect } from 'vitest'
import loader from '@/lib/image-loader'

describe('imageLoader (passthrough)', () => {
  it('returns the src URL unchanged', () => {
    const src = 'https://picsum.photos/seed/test/800/600'
    const result = loader({ src, width: 800, quality: 80 })
    expect(result).toBe(src)
  })

  it('returns the src URL unchanged when quality is not provided', () => {
    const src = 'https://example.com/image.jpg'
    const result = loader({ src, width: 400 })
    expect(result).toBe(src)
  })
})
