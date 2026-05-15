import type { Meta, StoryObj } from '@storybook/react'
import NavbarBlock from './NavbarBlock'
import { mockNavLinks } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/NavbarBlock',
  component: NavbarBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NavbarBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { _type: 'navbar', logo: 'Acme', links: mockNavLinks, ctaLabel: 'Book now' },
}
export const LogoOnly: Story = {
  args: { _type: 'navbar', logo: 'Acme' },
}
