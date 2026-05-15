import type { Meta, StoryObj } from '@storybook/react'
import { Navbar } from './Navbar'
import { mockNavLinks } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Navigation/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const LogoOnly: Story = { args: { logo: 'Acme' } }
export const WithLinks: Story = { args: { logo: 'Acme', links: mockNavLinks } }
export const WithCta: Story = { args: { logo: 'Acme', links: mockNavLinks, ctaLabel: 'Book now' } }
