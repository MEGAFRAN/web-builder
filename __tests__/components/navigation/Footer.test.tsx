import type { ComponentProps } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/navigation/Footer'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const oneColumn = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
    ],
  },
]

const twoColumns = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]

const threeColumns = [
  ...twoColumns,
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact', href: '/contact' },
    ],
  },
]

const fourColumns = [
  ...threeColumns,
  {
    title: 'Social',
    links: [
      { label: 'Twitter', href: 'https://twitter.com/acme' },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/acme' },
    ],
  },
]

// Five columns — component must cap colCount at 4 and only render 4 columns
const fiveColumns = [
  ...fourColumns,
  {
    title: 'Extra',
    links: [{ label: 'Extra Link', href: '/extra' }],
  },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderFooter(props: React.ComponentProps<typeof Footer> = {}) {
  const { container } = render(<Footer {...props} />)
  return container
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Footer', () => {
  describe('root element', () => {
    it('renders a <footer> with data-component="footer"', () => {
      const container = renderFooter()
      const footer = container.querySelector('footer[data-component="footer"]')
      expect(footer).not.toBeNull()
    })
  })

  describe('no columns, no copyright', () => {
    it('renders the footer without a grid div when neither columns nor copyright is provided', () => {
      const container = renderFooter()
      expect(container.querySelector('.grid')).toBeNull()
    })

    it('renders no copyright paragraph when neither prop is provided', () => {
      renderFooter()
      // The copyright paragraph has no role, query by its border-top class
      const container = renderFooter()
      const paras = Array.from(container.querySelectorAll('p'))
      expect(paras).toHaveLength(0)
    })
  })

  describe('columns={null} and columns={[]}', () => {
    it.each([
      ['null', null],
      ['empty array', []],
    ] as const)('does not render the grid when columns is %s', (_label, value) => {
      const container = renderFooter({ columns: value })
      expect(container.querySelector('.grid')).toBeNull()
    })
  })

  describe('copyright={null} and copyright omitted', () => {
    it.each([
      ['null', null as null | undefined],
      ['undefined', undefined],
    ])('does not render the copyright paragraph when copyright is %s', (_label, value) => {
      const container = renderFooter({ columns: oneColumn, copyright: value })
      // Confirm no <p> with border-t exists (copyright paragraph has border-t class)
      const copyrightEl = container.querySelector('p.border-t')
      expect(copyrightEl).toBeNull()
    })
  })

  describe('single column', () => {
    it('renders the column title', () => {
      renderFooter({ columns: oneColumn })
      expect(screen.getByText('Company')).toBeInTheDocument()
    })

    it.each(oneColumn[0].links)('renders link "$label" with correct href', ({ label, href }) => {
      renderFooter({ columns: oneColumn })
      const link = screen.getByRole('link', { name: label })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', href)
    })
  })

  describe('two columns — grid class', () => {
    it('renders both column titles', () => {
      renderFooter({ columns: twoColumns })
      expect(screen.getByText('Company')).toBeInTheDocument()
      expect(screen.getByText('Legal')).toBeInTheDocument()
    })

    it('applies the correct grid class for two columns', () => {
      const container = renderFooter({ columns: twoColumns })
      const grid = container.querySelector('.grid')
      expect(grid?.className).toContain('grid-cols-1 sm:grid-cols-2')
    })

    it('renders all links for both columns', () => {
      renderFooter({ columns: twoColumns })
      expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    })
  })

  describe('three columns — grid class', () => {
    it('applies grid-cols-1 sm:grid-cols-2 md:grid-cols-3', () => {
      const container = renderFooter({ columns: threeColumns })
      const grid = container.querySelector('.grid')
      expect(grid?.className).toContain('grid-cols-1 sm:grid-cols-2 md:grid-cols-3')
    })

    it('renders all three column titles', () => {
      renderFooter({ columns: threeColumns })
      expect(screen.getByText('Company')).toBeInTheDocument()
      expect(screen.getByText('Legal')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
    })
  })

  describe('four columns — grid class', () => {
    it('applies grid-cols-1 sm:grid-cols-2 md:grid-cols-4', () => {
      const container = renderFooter({ columns: fourColumns })
      const grid = container.querySelector('.grid')
      expect(grid?.className).toContain('grid-cols-1 sm:grid-cols-2 md:grid-cols-4')
    })

    it('renders all four column titles', () => {
      renderFooter({ columns: fourColumns })
      expect(screen.getByText('Company')).toBeInTheDocument()
      expect(screen.getByText('Legal')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
      expect(screen.getByText('Social')).toBeInTheDocument()
    })
  })

  describe('five+ columns — colCount capped at 4', () => {
    // The component uses Math.min(columns.length, 4) only to select the CSS grid
    // class. It still renders all supplied column objects via .map(). Therefore:
    // - The grid class is the 4-column variant
    // - All 5 column titles are rendered in the DOM

    it('applies the 4-column grid class when 5 columns are supplied', () => {
      const container = renderFooter({ columns: fiveColumns })
      const grid = container.querySelector('.grid')
      expect(grid?.className).toContain('grid-cols-1 sm:grid-cols-2 md:grid-cols-4')
    })

    it('still renders all 5 column divs in the DOM (colCount only gates the CSS class)', () => {
      const container = renderFooter({ columns: fiveColumns })
      const grid = container.querySelector('.grid')
      const colDivs = Array.from(grid?.children ?? [])
      expect(colDivs).toHaveLength(5)
    })

    it('renders the fifth column title in the DOM', () => {
      renderFooter({ columns: fiveColumns })
      expect(screen.getByText('Extra')).toBeInTheDocument()
    })
  })

  describe('copyright text', () => {
    it('renders the copyright text when provided', () => {
      renderFooter({ copyright: '© 2026 Acme Corp. All rights reserved.' })
      expect(screen.getByText('© 2026 Acme Corp. All rights reserved.')).toBeInTheDocument()
    })

    it('renders the copyright text inside a <p> element with border-t class', () => {
      const container = renderFooter({ copyright: '© 2026 Acme Corp.' })
      const para = container.querySelector('p.border-t')
      expect(para).not.toBeNull()
      expect(para?.textContent).toBe('© 2026 Acme Corp.')
    })
  })

  describe('column with undefined links', () => {
    it('renders the column title and no anchor tags when links is undefined', () => {
      const columns = [{ title: 'Bare', links: undefined }] as unknown as ComponentProps<
        typeof Footer
      >['columns']
      const container = renderFooter({ columns })
      expect(screen.getByText('Bare')).toBeInTheDocument()
      expect(container.querySelectorAll('a')).toHaveLength(0)
    })
  })

  describe('column with empty links array', () => {
    it('renders the column title when links is empty', () => {
      renderFooter({ columns: [{ title: 'Empty Column', links: [] }] })
      expect(screen.getByText('Empty Column')).toBeInTheDocument()
    })

    it('renders no <a> elements for a column with an empty links array', () => {
      const container = renderFooter({ columns: [{ title: 'Empty Column', links: [] }] })
      expect(container.querySelectorAll('a')).toHaveLength(0)
    })
  })
})
