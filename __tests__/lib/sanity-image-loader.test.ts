// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Must set env vars before importing the module
beforeEach(() => {
  process.env.SANITY_PROJECT_ID = 'testproject'
  process.env.SANITY_DATASET = 'test-dataset'
  vi.resetModules()
})

describe('sanityImageLoader', () => {
  it('returns a URL containing the project ID, width, and quality', async () => {
    const { default: loader } = await import('@/lib/sanity-image-loader')
    const url = loader({ src: 'image-abc123def456-1920x1080-jpg', width: 800, quality: 80 })

    expect(url).toContain('testproject')
    expect(url).toContain('w=800')
  })

  it('uses quality 75 when quality is not provided', async () => {
    const { default: loader } = await import('@/lib/sanity-image-loader')
    const url = loader({ src: 'image-abc123def456-1920x1080-jpg', width: 400 })

    expect(url).toContain('q=75')
  })
})
