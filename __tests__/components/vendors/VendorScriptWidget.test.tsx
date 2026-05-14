import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { createRef, type ComponentProps } from 'react'
import {
  VendorScriptWidget,
  type VendorScriptWidgetHandle,
} from '@/components/vendors/VendorScriptWidget'

describe('VendorScriptWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  function mountWidget(props: ComponentProps<typeof VendorScriptWidget>) {
    const ref = createRef<VendorScriptWidgetHandle>()
    const utils = render(
      <VendorScriptWidget {...props} ref={ref} />,
    )
    return { ref, ...utils }
  }

  it.each([
    [true, 'relative isolate'],
    [false, 'sr-only'],
  ] as const)('sets root class when isVisible=%s', (isVisible, expectedClassSubstring) => {
    const { container } = mountWidget({
      src: 'https://embed.example.com/widget.js',
      isVisible,
    })
    const root = container.querySelector('[data-component="vendor-script-widget"]')!
    expect(root.className).toContain(expectedClassSubstring)
  })

  it('activates scoped target immediately via imperative handle', () => {
    const { ref, container } = mountWidget({
      src: 'https://embed.example.com/w.js',
      isVisible: true,
    })
    const root = container.querySelector('[data-component="vendor-script-widget"]')!
    const target = document.createElement('button')
    target.className = 'booksy-widget-button'
    root.appendChild(target)
    const clickSpy = vi.spyOn(target, 'click')

    ref.current!.activate()

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('falls back to document when target is not under widget root', () => {
    const { ref } = mountWidget({
      src: 'https://embed.example.com/w.js',
      isVisible: true,
    })
    const target = document.createElement('button')
    target.className = 'booksy-widget-button'
    document.body.appendChild(target)
    const clickSpy = vi.spyOn(target, 'click')

    ref.current!.activate()

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('retries activation until target appears within interval budget', () => {
    const { ref } = mountWidget({
      src: 'https://embed.example.com/w.js',
      isVisible: false,
    })
    ref.current!.activate()

    const target = document.createElement('button')
    target.className = 'booksy-widget-button'
    document.body.appendChild(target)
    const clickSpy = vi.spyOn(target, 'click')

    vi.advanceTimersByTime(100)

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('uses clickTargetClass when the selector is passed with a leading dot', () => {
    const { ref, container } = mountWidget({
      src: 'https://embed.example.com/w.js',
      isVisible: true,
      clickTargetClass: '.reserve-btn',
    })
    const root = container.querySelector('[data-component="vendor-script-widget"]')!
    const target = document.createElement('button')
    target.className = 'reserve-btn'
    root.appendChild(target)
    const clickSpy = vi.spyOn(target, 'click')

    ref.current!.activate()

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('still clicks target when scrollIntoView throws', () => {
    const { ref, container } = mountWidget({
      src: 'https://embed.example.com/w.js',
      isVisible: true,
    })
    const root = container.querySelector('[data-component="vendor-script-widget"]')!
    const target = document.createElement('button')
    target.className = 'booksy-widget-button'
    root.appendChild(target)
    target.scrollIntoView = vi.fn(() => {
      throw new Error('scroll failed')
    }) as HTMLElement['scrollIntoView']
    const clickSpy = vi.spyOn(target, 'click')

    ref.current!.activate()

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('stops retrying after max attempts without calling click', () => {
    const { ref } = mountWidget({
      src: 'https://embed.example.com/w.js',
      isVisible: false,
    })
    const orphan = document.createElement('button')
    orphan.className = 'different-class'
    document.body.appendChild(orphan)
    vi.spyOn(orphan, 'click')

    ref.current!.activate()
    vi.advanceTimersByTime(100 * 35)

    expect(orphan.click).not.toHaveBeenCalled()
  })
})
