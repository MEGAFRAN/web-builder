import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CaseStudyDetailBlock from '@/components/blocks/CaseStudyDetailBlock'
import type { CaseStudyDetailBlock as CaseStudyDetailBlockType } from '@/types/cms'

const baseProps: CaseStudyDetailBlockType = {
  _type: 'caseStudyDetailBlock',
  title: 'Building a Scalable Platform',
  challengeBody: 'The client needed to scale from 10 to 10,000 users.',
  techStack: [
    { category: 'Frontend', items: ['React', 'TypeScript'] },
    { category: 'Backend', items: ['Node.js', 'PostgreSQL'] },
  ],
  solutionItems: [
    { title: 'Microservices Architecture', description: 'Split into independent services.' },
    { title: 'CI/CD Pipeline', description: 'Automated deployment on every merge.' },
  ],
  ahaBody: 'The breakthrough came when we switched to event-driven design.',
  impactItems: [
    { value: '10x', label: 'Performance improvement' },
    { value: '60%', label: 'Cost reduction' },
  ],
}

describe('CaseStudyDetailBlock', () => {
  it('renders the page title as an h1', () => {
    render(<CaseStudyDetailBlock {...baseProps} />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Building a Scalable Platform' })
    ).toBeInTheDocument()
  })

  it('renders the challenge body text', () => {
    render(<CaseStudyDetailBlock {...baseProps} />)
    expect(
      screen.getByText('The client needed to scale from 10 to 10,000 users.')
    ).toBeInTheDocument()
  })

  it('renders each tech stack category and its items', () => {
    render(<CaseStudyDetailBlock {...baseProps} />)
    expect(screen.getByText('Frontend')).toBeInTheDocument()
    expect(screen.getByText('React, TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Backend')).toBeInTheDocument()
    expect(screen.getByText('Node.js, PostgreSQL')).toBeInTheDocument()
  })

  it('renders each solution item title and description', () => {
    render(<CaseStudyDetailBlock {...baseProps} />)
    expect(screen.getByText('Microservices Architecture')).toBeInTheDocument()
    expect(screen.getByText('Split into independent services.')).toBeInTheDocument()
    expect(screen.getByText('CI/CD Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Automated deployment on every merge.')).toBeInTheDocument()
  })

  it('renders the aha body text', () => {
    render(<CaseStudyDetailBlock {...baseProps} />)
    expect(
      screen.getByText('The breakthrough came when we switched to event-driven design.')
    ).toBeInTheDocument()
  })

  it('renders impact items with their values and labels', () => {
    render(<CaseStudyDetailBlock {...baseProps} />)
    expect(screen.getByText('10x')).toBeInTheDocument()
    expect(screen.getByText('Performance improvement')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('Cost reduction')).toBeInTheDocument()
  })

  it('uses fallback section headings when optional heading props are omitted', () => {
    render(<CaseStudyDetailBlock {...baseProps} />)
    expect(screen.getByRole('heading', { name: 'The Challenge' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The Tech Stack' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The Solution' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Aha/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The Business Impact' })).toBeInTheDocument()
  })

  it('uses custom section headings when provided', () => {
    render(
      <CaseStudyDetailBlock
        {...baseProps}
        challengeHeading="The Problem"
        techStackHeading="Technologies Used"
        solutionHeading="Our Approach"
        ahaHeading="Key Insight"
        impactHeading="Results"
      />
    )
    expect(screen.getByRole('heading', { name: 'The Problem' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Technologies Used' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Our Approach' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Key Insight' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument()
  })

  it('renders breadcrumb navigation when breadcrumbItems are provided', () => {
    render(
      <CaseStudyDetailBlock
        {...baseProps}
        breadcrumbItems={[
          { label: 'Home', href: '/' },
          { label: 'Case Studies', href: '/case-studies' },
          { label: baseProps.title },
        ]}
      />
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('does not render breadcrumb navigation when breadcrumbItems is empty', () => {
    render(<CaseStudyDetailBlock {...baseProps} breadcrumbItems={[]} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('renders tag badges when tags are provided', () => {
    render(<CaseStudyDetailBlock {...baseProps} tags={['Next.js', 'SaaS']} />)
    expect(screen.getByText('Next.js')).toBeInTheDocument()
    expect(screen.getByText('SaaS')).toBeInTheDocument()
  })

  it('renders a back link to /success-cases', () => {
    render(<CaseStudyDetailBlock {...baseProps} />)
    expect(
      screen.getByRole('link', { name: /back to success cases/i })
    ).toHaveAttribute('href', '/success-cases')
  })
})
