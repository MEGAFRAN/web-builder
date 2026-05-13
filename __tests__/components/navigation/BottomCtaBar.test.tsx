import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomCtaBar } from '@/components/navigation/BottomCtaBar'

describe('BottomCtaBar', () => {
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
})
