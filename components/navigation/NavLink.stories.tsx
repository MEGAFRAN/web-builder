import type { Meta, StoryObj } from '@storybook/react'
import { NavLink } from './NavLink'

const meta = {
  title: 'Navigation/NavLink',
  component: NavLink,
  tags: ['autodocs'],
} satisfies Meta<typeof NavLink>

export default meta
type Story = StoryObj<typeof meta>

export const Inactive: Story = { args: { label: 'Services', href: '/services' } }
export const Active: Story = { args: { label: 'About', href: '/about', active: true } }
