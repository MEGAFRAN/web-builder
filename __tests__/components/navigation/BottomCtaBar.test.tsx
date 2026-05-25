import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomCtaBar } from '@/components/navigation/BottomCtaBar'
import { BOOKING_MODAL_OPEN_EVENT } from '@/lib/booking-modal-events'

describe('BottomCtaBar', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('renders nothing when items is empty', () => {
    const { container } = render(<BottomCtaBar items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a nav with one link per item', () => {
    render(
      <BottomCtaBar
        items={[
          { label: 'Home', href: '/' },
          { label: 'Call', href: 'tel:+15550100200' },
        ]}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Quick actions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute('href', 'tel:+15550100200')
  })

  it('opens external https links in a new tab', () => {
    render(
      <BottomCtaBar
        items={[{ label: 'Chat', href: 'https://wa.me/15550100200' }]}
      />,
    )
    const link = screen.getByRole('link', { name: 'Chat' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not use target blank for tel links', () => {
    render(
      <BottomCtaBar items={[{ label: 'Phone', href: 'tel:+1' }]} />,
    )
    const link = screen.getByRole('link', { name: 'Phone' })
    expect(link).not.toHaveAttribute('target')
  })

  it('renders a button for activateVendorScript when vendorScriptWidget.src is set', () => {
    render(
      <BottomCtaBar
        vendorScriptWidget={{ src: 'https://example.com/embed.js', isVisible: false }}
        items={[
          { label: 'Reserve', href: '#fallback', action: 'activateVendorScript' },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Reserve' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reserve' })).not.toBeInTheDocument()
  })

  it.each([
    ['omitted', {}],
    ['null', { isVisible: null }],
  ] as const)('defaults vendor isVisible to false when %s', (_label, widgetExtra) => {
    render(
      <BottomCtaBar
        vendorScriptWidget={{ src: 'https://example.com/widget.js', ...widgetExtra }}
        items={[{ label: 'Go', href: '#', action: 'activateVendorScript' }]}
      />,
    )
    const mount = document.querySelector('[data-component="vendor-script-widget"]')
    expect(mount?.className).toContain('sr-only')
  })

  it('opens protocol-relative links in a new tab', () => {
    render(
      <BottomCtaBar
        items={[{ label: 'External', href: '//cdn.example.com/x' }]}
      />,
    )
    const link = screen.getByRole('link', { name: 'External' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('rewrites icons under public/ to site-root paths', () => {
    render(
      <BottomCtaBar
        items={[
          {
            label: 'Foo',
            href: '/foo',
            icon: 'public/icons/foo.svg',
          },
        ]}
      />,
    )
    expect(screen.getByRole('navigation').querySelector('img')).toHaveAttribute(
      'src',
      '/icons/foo.svg',
    )
  })

  it.each([
    ['3-digit hex', '#f00'],
    ['6-digit hex', '#ff0011'],
  ] as const)('renders a tinted mask icon when iconColor is %s', (_label, iconColor) => {
    const { container } = render(
      <BottomCtaBar
        items={[
          {
            label: 'Bar',
            href: '/bar',
            icon: 'https://cdn.example.com/icon.svg',
            iconColor,
          },
        ]}
      />,
    )
    expect(container.querySelector('span[style*="mask-image"]')).not.toBeNull()
  })

  it('renders a plain img when iconColor is not a safe hex value', () => {
    render(
      <BottomCtaBar
        items={[
          {
            label: 'Bar',
            href: '/bar',
            icon: 'https://cdn.example.com/icon.svg',
            iconColor: '#nothex',
          },
        ]}
      />,
    )
    expect(screen.getByRole('navigation').querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/icon.svg',
    )
  })

  it('renders emoji text when icon is not a recognizable path/url', () => {
    render(
      <BottomCtaBar
        items={[
          {
            label: 'Emoji',
            href: '/emoji',
            icon: '🙂',
          },
        ]}
      />,
    )
    expect(screen.getByText('🙂', { exact: false })).toBeInTheDocument()
  })

  it('invokes embedded vendor activate target when tapping vendor action', () => {
    const target = document.createElement('button')
    target.className = 'booksy-widget-button'
    document.body.appendChild(target)
    const clickSpy = vi.spyOn(target, 'click')

    render(
      <BottomCtaBar
        vendorScriptWidget={{ src: 'https://example.com/embed.js', isVisible: false }}
        items={[{ label: 'Reserve', href: '#fallback', action: 'activateVendorScript' }]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reserve' }))
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('falls back to a link when action is activateVendorScript but vendor widget is missing', () => {
    render(
      <BottomCtaBar
        items={[
          {
            label: 'Reserve',
            href: '/book',
            action: 'activateVendorScript',
          },
        ]}
      />,
    )
    const link = screen.getByRole('link', { name: 'Reserve' })
    expect(link).toHaveAttribute('href', '/book')
    expect(screen.queryByRole('button', { name: 'Reserve' })).not.toBeInTheDocument()
  })

  it('opens the booking modal when Book uses href #book', () => {
    const openHandler = vi.fn()
    window.addEventListener(BOOKING_MODAL_OPEN_EVENT, openHandler)

    render(
      <BottomCtaBar
        items={[
          { label: 'Call', href: 'tel:+15550100200' },
          { label: 'Book', href: '#book' },
        ]}
      />,
    )

    expect(screen.queryByRole('link', { name: 'Book' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Book' }))
    expect(openHandler).toHaveBeenCalledTimes(1)

    window.removeEventListener(BOOKING_MODAL_OPEN_EVENT, openHandler)
  })
})
