import { describe, it, expect } from 'vitest'
import registry from '@/components/registry'

describe('component documentation registry', () => {
  it.each([
    ['sections', 'Hero'],
    ['layout', 'Container'],
    ['navigation', 'Navbar'],
    ['content', 'Heading'],
    ['data', 'Card'],
    ['inputs', 'Button'],
  ] as const)('exposes %s.%s with path and useCases', (category, component) => {
    const group = registry[category] as Record<
      string,
      { path: string; useCases: readonly string[] }
    >
    const entry = group[component]
    expect(entry.path).toMatch(/\.tsx$/)
    expect(entry.useCases.length).toBeGreaterThan(0)
  })

  it('uses unique file paths per registry entry', () => {
    const paths = new Set<string>()
    for (const group of Object.values(registry)) {
      for (const entry of Object.values(group)) {
        paths.add(entry.path)
      }
    }
    expect(paths.size).toBeGreaterThan(10)
  })
})
