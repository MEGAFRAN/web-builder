import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CaseStudiesBlock from '@/components/blocks/CaseStudiesBlock'
import type { CaseStudyItem } from '@/types/cms'

const items: CaseStudyItem[] = [
  {
    title: 'Rebranding Acme Corp',
    client: 'Acme Corp',
    industry: 'Retail',
    summary: 'A full brand overhaul.',
    coverImageUrl: null,
    slug: 'acme-corp',
    publishedAt: '2024-06-01',
  },
  {
    title: 'Digital Transformation at Globex',
    client: 'Globex',
    industry: 'Finance',
    summary: 'End-to-end digital shift.',
    coverImageUrl: null,
    slug: 'globex',
    publishedAt: '2024-01-15',
  },
]

describe('CaseStudiesBlock', () => {
  it('renders all case study titles', () => {
    render(
      <CaseStudiesBlock _type="caseStudiesBlock" items={items} />
    )
    expect(screen.getByText('Rebranding Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Digital Transformation at Globex')).toBeInTheDocument()
  })

  it('renders the optional heading and subtext', () => {
    render(
      <CaseStudiesBlock
        _type="caseStudiesBlock"
        items={items}
        heading="Our Work"
        subtext="Recent client success stories"
      />
    )
    expect(screen.getByRole('heading', { name: 'Our Work' })).toBeInTheDocument()
    expect(screen.getByText('Recent client success stories')).toBeInTheDocument()
  })

  it('does not render heading section when neither heading nor subtext is provided', () => {
    render(<CaseStudiesBlock _type="caseStudiesBlock" items={items} />)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('sorts items newest-first by publishedAt', () => {
    render(
      <CaseStudiesBlock _type="caseStudiesBlock" items={items} />
    )
    const headings = screen.getAllByRole('heading', { level: 3 })
    // Acme Corp (2024-06-01) is newer than Globex (2024-01-15)
    expect(headings[0]).toHaveTextContent('Rebranding Acme Corp')
    expect(headings[1]).toHaveTextContent('Digital Transformation at Globex')
  })

  it('renders a "Read Case Study" link for each item with the correct href', () => {
    render(
      <CaseStudiesBlock _type="caseStudiesBlock" items={items} />
    )
    const links = screen.getAllByRole('link', { name: /read case study/i })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/case-studies/acme-corp')
  })

  it('uses a custom href when provided instead of the default slug path', () => {
    const customItems: CaseStudyItem[] = [
      { ...items[0], href: '/custom/link' },
    ]
    render(<CaseStudiesBlock _type="caseStudiesBlock" items={customItems} />)
    const link = screen.getByRole('link', { name: /read case study/i })
    expect(link).toHaveAttribute('href', '/custom/link')
  })

  it('renders industry badge for each item', () => {
    render(<CaseStudiesBlock _type="caseStudiesBlock" items={items} />)
    expect(screen.getByText('Retail')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
  })

  it('places items without publishedAt after dated items', () => {
    const mixedItems: CaseStudyItem[] = [
      { ...items[0], publishedAt: null, slug: 'no-date' },
      ...items,
    ]
    render(<CaseStudiesBlock _type="caseStudiesBlock" items={mixedItems} />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    // Dated items should appear before the undated one
    const lastHeading = headings[headings.length - 1]
    expect(lastHeading).toHaveTextContent('Rebranding Acme Corp')
  })
})
