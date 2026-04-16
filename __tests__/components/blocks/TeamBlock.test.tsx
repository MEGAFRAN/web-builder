import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TeamBlock from '@/components/blocks/TeamBlock'
import type { TeamMember } from '@/types/cms'

const members: TeamMember[] = [
  {
    name: 'Alice Chen',
    role: 'CEO',
    bio: 'Founder with 15 years of industry experience.',
    photoUrl: null,
    order: 1,
  },
  {
    name: 'Bob Kim',
    role: 'CTO',
    bio: 'Full-stack engineer passionate about scalability.',
    photoUrl: null,
    order: 2,
  },
  {
    name: 'Carol Davis',
    role: 'Designer',
    bio: 'Creates beautiful, user-centric interfaces.',
    photoUrl: null,
    order: 3,
  },
]

describe('TeamBlock', () => {
  it('renders all team member names', () => {
    render(<TeamBlock _type="teamBlock" members={members} />)
    expect(screen.getByText('Alice Chen')).toBeInTheDocument()
    expect(screen.getByText('Bob Kim')).toBeInTheDocument()
    expect(screen.getByText('Carol Davis')).toBeInTheDocument()
  })

  it('renders each member role as a badge', () => {
    render(<TeamBlock _type="teamBlock" members={members} />)
    expect(screen.getByText('CEO')).toBeInTheDocument()
    expect(screen.getByText('CTO')).toBeInTheDocument()
    expect(screen.getByText('Designer')).toBeInTheDocument()
  })

  it('renders each member bio', () => {
    render(<TeamBlock _type="teamBlock" members={members} />)
    expect(
      screen.getByText('Founder with 15 years of industry experience.')
    ).toBeInTheDocument()
  })

  it('sorts members by order field', () => {
    const shuffled: TeamMember[] = [members[2], members[0], members[1]]
    render(<TeamBlock _type="teamBlock" members={shuffled} />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings[0]).toHaveTextContent('Alice Chen')
    expect(headings[1]).toHaveTextContent('Bob Kim')
    expect(headings[2]).toHaveTextContent('Carol Davis')
  })

  it('renders the optional section heading', () => {
    render(
      <TeamBlock _type="teamBlock" heading="Meet the Team" members={members} />
    )
    expect(
      screen.getByRole('heading', { name: 'Meet the Team' })
    ).toBeInTheDocument()
  })

  it('does not render a section heading when heading is omitted', () => {
    render(<TeamBlock _type="teamBlock" members={members} />)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('wraps content in a data-component="team-block" element', () => {
    const { container } = render(
      <TeamBlock _type="teamBlock" members={members} />
    )
    expect(
      container.querySelector('[data-component="team-block"]')
    ).toBeInTheDocument()
  })
})
