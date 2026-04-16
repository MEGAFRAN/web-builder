import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table } from '@/components/data/Table'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const COLUMNS = ['Name', 'Role', 'Status']
const ROWS = [
  ['Alice', 'Admin', 'Active'],
  ['Bob',   'User',  'Inactive'],
  ['Carol', 'User',  'Active'],
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderTable(props: React.ComponentProps<typeof Table>) {
  const { container } = render(<Table {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="table"]') as HTMLDivElement
}

function getHeaderCells(container: HTMLElement) {
  return Array.from(container.querySelectorAll('th'))
}

function getDataRows(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr'))
}

function getDataCells(row: Element) {
  return Array.from(row.querySelectorAll('td'))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Table', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="table"', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      expect(getRoot(container)).not.toBeNull()
    })

    it('applies overflow-x-auto to the wrapper div', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      expect(getRoot(container).className).toContain('overflow-x-auto')
    })
  })

  describe('columns prop', () => {
    it('renders the correct number of <th> elements', () => {
      const container = renderTable({ columns: COLUMNS, rows: [] })
      expect(getHeaderCells(container)).toHaveLength(COLUMNS.length)
    })

    it('renders each column label inside a <th>', () => {
      renderTable({ columns: COLUMNS, rows: [] })
      COLUMNS.forEach((col) => {
        expect(screen.getByRole('columnheader', { name: col })).toBeInTheDocument()
      })
    })

    it('applies uppercase tracking class to header cells', () => {
      const container = renderTable({ columns: COLUMNS, rows: [] })
      getHeaderCells(container).forEach((th) => {
        expect(th.className).toContain('uppercase')
      })
    })

    it('renders a single column correctly', () => {
      const container = renderTable({ columns: ['Item'], rows: [] })
      expect(getHeaderCells(container)).toHaveLength(1)
    })
  })

  describe('rows prop', () => {
    it('renders the correct number of <tr> elements in <tbody>', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      expect(getDataRows(container)).toHaveLength(ROWS.length)
    })

    it('renders the correct number of <td> cells per row', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      getDataRows(container).forEach((row, i) => {
        expect(getDataCells(row)).toHaveLength(ROWS[i].length)
      })
    })

    it('renders the correct cell text in each row', () => {
      renderTable({ columns: COLUMNS, rows: ROWS })
      ROWS.forEach((row) => {
        row.forEach((cellText) => {
          expect(screen.getAllByText(cellText).length).toBeGreaterThanOrEqual(1)
        })
      })
    })

    it('renders an empty <tbody> when rows is an empty array', () => {
      const container = renderTable({ columns: COLUMNS, rows: [] })
      expect(getDataRows(container)).toHaveLength(0)
    })
  })

  describe('striped prop', () => {
    it('applies bg-muted-bg to even-indexed rows when striped={true}', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS, striped: true })
      const dataRows = getDataRows(container)
      // Even-indexed rows (0, 2, …) get bg-muted-bg; odd rows get bg-background
      expect(dataRows[0].className).toContain('bg-muted-bg')
      expect(dataRows[1].className).toContain('bg-background')
      expect(dataRows[2].className).toContain('bg-muted-bg')
    })

    it('applies bg-background to all rows when striped={false}', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS, striped: false })
      getDataRows(container).forEach((row) => {
        expect(row.className).toContain('bg-background')
      })
    })

    it('applies bg-background to all rows when striped is omitted', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      getDataRows(container).forEach((row) => {
        expect(row.className).toContain('bg-background')
      })
    })

    it('applies bg-background to all rows when striped={null}', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS, striped: null })
      getDataRows(container).forEach((row) => {
        expect(row.className).toContain('bg-background')
      })
    })
  })

  describe('semantic structure', () => {
    it('renders a <table> element', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      expect(container.querySelector('table')).not.toBeNull()
    })

    it('renders a <thead> element', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      expect(container.querySelector('thead')).not.toBeNull()
    })

    it('renders a <tbody> element', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      expect(container.querySelector('tbody')).not.toBeNull()
    })

    it('places column headers inside <thead>', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      const thead = container.querySelector('thead') as HTMLElement
      expect(thead.querySelectorAll('th')).toHaveLength(COLUMNS.length)
    })

    it('places data rows inside <tbody>', () => {
      const container = renderTable({ columns: COLUMNS, rows: ROWS })
      const tbody = container.querySelector('tbody') as HTMLElement
      expect(tbody.querySelectorAll('tr')).toHaveLength(ROWS.length)
    })
  })
})
