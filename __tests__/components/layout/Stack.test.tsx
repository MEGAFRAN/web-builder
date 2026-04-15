import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { Stack } from '@/components/layout/Stack'

describe('Stack', () => {
  it('gap="md" → style.gap = var(--content-gap)', () => {
    render(<Stack gap="md"><span /></Stack>)
    const el = document.querySelector('[data-component="stack"]') as HTMLElement
    expect(el.style.gap).toBe('var(--content-gap)')
  })

  it('gap="none" → style.gap = 0', () => {
    render(<Stack gap="none"><span /></Stack>)
    const el = document.querySelector('[data-component="stack"]') as HTMLElement
    // jsdom serialises numeric 0 as '0px'
    expect(el.style.gap).toBe('0px')
  })

  it('gap="lg" → style.gap contains * 2', () => {
    render(<Stack gap="lg"><span /></Stack>)
    const el = document.querySelector('[data-component="stack"]') as HTMLElement
    expect(el.style.gap).toContain('* 2')
  })

  it('gap="sm" → style.gap contains * 0.5', () => {
    render(<Stack gap="sm"><span /></Stack>)
    const el = document.querySelector('[data-component="stack"]') as HTMLElement
    expect(el.style.gap).toContain('0.5')
  })

  it('gap="xl" → style.gap contains * 3', () => {
    render(<Stack gap="xl"><span /></Stack>)
    const el = document.querySelector('[data-component="stack"]') as HTMLElement
    expect(el.style.gap).toContain('* 3')
  })

  it('renders children', () => {
    const { getByTestId } = render(
      <Stack>
        <span data-testid="child">hello</span>
      </Stack>
    )
    expect(getByTestId('child')).toBeTruthy()
  })
})
