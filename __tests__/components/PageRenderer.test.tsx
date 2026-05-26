import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageRenderer from '@/components/PageRenderer'
import type { Block } from '@/types/cms'

vi.mock('@/components/componentRegistry', () => ({
  default: {
    hero: ({ title }: { title: string }) => <div data-testid="hero-stub">{title}</div>,
    services: ({
      items,
      clientId,
      buildTimeCatalog,
    }: {
      items?: Array<{ title: string; description: string }>
      clientId?: string | null
      buildTimeCatalog?: Array<{ name: string }>
    }) => (
      <div
        data-testid="services-stub"
        data-client-id={clientId ?? ''}
        data-build-time-catalog={buildTimeCatalog?.map((item) => item.name).join(', ') ?? ''}
      >
        {(items ?? []).map(i => i.title).join(', ')}
      </div>
    ),
  },
}))

describe('PageRenderer', () => {
  it('renders an empty wrapper when blocks is an empty array', () => {
    const { container } = render(<PageRenderer blocks={[]} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
    expect(wrapper.children).toHaveLength(0)
  })

  it('renders a known block type', () => {
    const blocks: Block[] = [{ _type: 'hero', title: 'Welcome Home' }]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByTestId('hero-stub')).toBeInTheDocument()
    expect(screen.getByText('Welcome Home')).toBeInTheDocument()
  })

  it('renders multiple blocks of different known types', () => {
    const blocks: Block[] = [
      { _type: 'hero', title: 'Hello World' },
      {
        _type: 'services',
        items: [
          { title: 'Web Design', description: 'We design websites' },
          { title: 'SEO', description: 'We do SEO' },
        ],
      },
    ]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByTestId('hero-stub')).toBeInTheDocument()
    expect(screen.getByTestId('services-stub')).toBeInTheDocument()
    expect(screen.getByText('Web Design, SEO')).toBeInTheDocument()
  })

  describe('unknown block type', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('renders nothing for an unknown block type', () => {
      // Cast required to inject an unregistered _type without TS error
      const blocks = [{ _type: 'unknownBlock' }] as unknown as Block[]
      const { container } = render(<PageRenderer blocks={blocks} />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children).toHaveLength(0)
    })

    it('calls console.warn with the correct message for an unknown block type', () => {
      const blocks = [{ _type: 'unknownBlock' }] as unknown as Block[]
      render(<PageRenderer blocks={blocks} />)
      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledWith('PageRenderer: unknown block type "unknownBlock"')
    })

    it('renders known blocks around an unknown one and only warns once', () => {
      const blocks = [
        { _type: 'hero', title: 'Before' },
        { _type: 'unknownBlock' },
        { _type: 'hero', title: 'After' },
      ] as unknown as Block[]
      render(<PageRenderer blocks={blocks} />)
      expect(screen.getAllByTestId('hero-stub')).toHaveLength(2)
      expect(warnSpy).toHaveBeenCalledOnce()
    })
  })

  it('renders correctly when blocks have _key props', () => {
    const blocks = [
      { _type: 'hero', title: 'First', _key: 'key-1' },
      { _type: 'hero', title: 'Second', _key: 'key-2' },
    ] as unknown as Block[]
    render(<PageRenderer blocks={blocks} />)
    const stubs = screen.getAllByTestId('hero-stub')
    expect(stubs).toHaveLength(2)
    expect(stubs[0]).toHaveTextContent('First')
    expect(stubs[1]).toHaveTextContent('Second')
  })

  it('falls back to index key when _key is absent', () => {
    const blocks: Block[] = [
      { _type: 'hero', title: 'Alpha' },
      { _type: 'hero', title: 'Beta' },
    ]
    render(<PageRenderer blocks={blocks} />)
    const stubs = screen.getAllByTestId('hero-stub')
    expect(stubs).toHaveLength(2)
    expect(stubs[0]).toHaveTextContent('Alpha')
    expect(stubs[1]).toHaveTextContent('Beta')
  })

  it('injects clientId into services blocks when omitted from page JSON', () => {
    const blocks: Block[] = [
      {
        _type: 'services',
        heading: 'Services',
        items: [{ title: 'Cut', description: 'Haircut' }],
      },
    ]
    render(<PageRenderer blocks={blocks} clientId="test" />)
    expect(screen.getByTestId('services-stub')).toHaveAttribute('data-client-id', 'test')
  })

  it('injects buildTimeCatalog into services blocks', () => {
    const blocks: Block[] = [{ _type: 'services', heading: 'Services' }]
    render(
      <PageRenderer
        blocks={blocks}
        clientId="test"
        bookingCatalog={[
          {
            id: 'svc-1',
            name: 'Cut',
            description: 'Haircut',
            durationMinutes: 30,
            price: 20,
            currency: '€',
          },
        ]}
      />,
    )
    expect(screen.getByTestId('services-stub')).toHaveAttribute(
      'data-build-time-catalog',
      'Cut',
    )
  })
})
