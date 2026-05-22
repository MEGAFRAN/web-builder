import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqBlock from '@/components/blocks/FaqBlock'
import type { FaqItem } from '@/types/cms'

const items: FaqItem[] = [
  { question: 'What is your return policy?', answer: 'You can return items within 30 days.' },
  { question: 'Do you offer free shipping?', answer: 'Yes, on orders over $50.' },
]

describe('FaqBlock', () => {
  it('renders all FAQ questions', () => {
    render(<FaqBlock _type="faqBlock" items={items} />)
    expect(screen.getByText('What is your return policy?')).toBeInTheDocument()
    expect(screen.getByText('Do you offer free shipping?')).toBeInTheDocument()
  })

  it('does not show answers before any question is expanded', () => {
    render(<FaqBlock _type="faqBlock" items={items} />)
    items.forEach(({ question }) => {
      expect(screen.getByRole('button', { name: question })).toHaveAttribute(
        'aria-expanded',
        'false',
      )
    })
  })

  it('reveals an answer when its question is clicked', () => {
    render(<FaqBlock _type="faqBlock" items={items} />)
    const button = screen.getByRole('button', { name: 'What is your return policy?' })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('You can return items within 30 days.')).toBeVisible()
  })

  it('collapses an open answer when its question is clicked again', () => {
    render(<FaqBlock _type="faqBlock" items={items} />)
    const button = screen.getByRole('button', { name: 'What is your return policy?' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders the optional section title', () => {
    render(<FaqBlock _type="faqBlock" title="Frequently Asked Questions" items={items} />)
    expect(
      screen.getByRole('heading', { name: 'Frequently Asked Questions' })
    ).toBeInTheDocument()
  })

  it('does not render a title element when title prop is omitted', () => {
    render(<FaqBlock _type="faqBlock" items={items} />)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})
