import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { Section } from '@/components/layout/Section'

describe('Section', () => {
  it('paddingY="lg" → style.paddingBlock = var(--section-spacing)', () => {
    const { getByRole } = render(<Section paddingY="lg"><span /></Section>)
    const el = document.querySelector('[data-component="section"]') as HTMLElement
    expect(el.style.paddingBlock).toBe('var(--section-spacing)')
  })

  it('paddingY="none" → style.paddingBlock = 0', () => {
    render(<Section paddingY="none"><span /></Section>)
    const el = document.querySelector('[data-component="section"]') as HTMLElement
    // jsdom serialises numeric 0 as '0px'
    expect(el.style.paddingBlock).toBe('0px')
  })

  it('paddingY="sm" → style.paddingBlock contains * 0.4', () => {
    render(<Section paddingY="sm"><span /></Section>)
    const el = document.querySelector('[data-component="section"]') as HTMLElement
    expect(el.style.paddingBlock).toContain('0.4')
  })

  it('paddingY="md" → style.paddingBlock contains * 0.6', () => {
    render(<Section paddingY="md"><span /></Section>)
    const el = document.querySelector('[data-component="section"]') as HTMLElement
    expect(el.style.paddingBlock).toContain('0.6')
  })

  it('paddingY="xl" → style.paddingBlock contains * 1.4', () => {
    render(<Section paddingY="xl"><span /></Section>)
    const el = document.querySelector('[data-component="section"]') as HTMLElement
    expect(el.style.paddingBlock).toContain('1.4')
  })

  it('renders children', () => {
    const { getByTestId } = render(
      <Section>
        <span data-testid="child">hello</span>
      </Section>
    )
    expect(getByTestId('child')).toBeTruthy()
  })
})
