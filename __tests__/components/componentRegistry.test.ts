import { describe, it, expect } from 'vitest'
import componentRegistry from '@/components/componentRegistry'

const registryKeys = Object.keys(componentRegistry) as Array<keyof typeof componentRegistry>

describe('componentRegistry', () => {
  it.each(registryKeys)('maps key %s to a loadable component', (key) => {
    const Comp = componentRegistry[key]
    expect(Comp).toBeTruthy()
    // next/dynamic wraps components; the loader is an object with a render callable.
    expect(['function', 'object']).toContain(typeof Comp)
  })
})
