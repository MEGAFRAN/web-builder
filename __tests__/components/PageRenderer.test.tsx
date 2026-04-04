import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageRenderer from '@/components/PageRenderer'
import type { Block } from '@/types/cms'

describe('PageRenderer', () => {
  it('renders a HeroBlock when _type is hero', () => {
    const blocks: Block[] = [{ _type: 'hero', title: 'Bienvenidos' }]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByRole('heading', { name: 'Bienvenidos' })).toBeInTheDocument()
  })

  it('renders a ServicesBlock when _type is services', () => {
    const blocks: Block[] = [
      { _type: 'services', items: [{ title: 'Corte', description: 'Desc' }] },
    ]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByText('Corte')).toBeInTheDocument()
  })

  it('renders a ContactBlock when _type is contact', () => {
    const blocks: Block[] = [
      { _type: 'contact', showMap: false, phone: '900000000' },
    ]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByText('900000000')).toBeInTheDocument()
  })

  it('renders a BlogListBlock when _type is blog_list', () => {
    const blocks: Block[] = [{ _type: 'blog_list', postsPerPage: 6 }]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByRole('heading', { name: /blog/i })).toBeInTheDocument()
  })

  it('renders multiple blocks in order', () => {
    const blocks: Block[] = [
      { _type: 'hero', title: 'Top' },
      { _type: 'contact', showMap: false, phone: '111' },
    ]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByRole('heading', { name: 'Top' })).toBeInTheDocument()
    expect(screen.getByText('111')).toBeInTheDocument()
  })

  it('renders nothing for an empty blocks array', () => {
    const { container } = render(<PageRenderer blocks={[]} />)
    expect(container.firstChild).toBeEmptyDOMElement()
  })
})
