import type { Meta, StoryObj } from '@storybook/react'
import { Footer } from './Footer'
import { mockFooterColumns } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Navigation/Footer',
  component: Footer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Footer>

export default meta
type Story = StoryObj<typeof meta>

export const CopyrightOnly: Story = {
  args: { copyright: '© 2025 Acme Corp. All rights reserved.' },
}
export const TwoColumns: Story = {
  args: { columns: mockFooterColumns.slice(0, 2), copyright: '© 2025 Acme Corp.' },
}
export const ThreeColumns: Story = {
  args: { columns: mockFooterColumns, copyright: '© 2025 Acme Corp. All rights reserved.' },
}
export const NoContent: Story = { args: {} }
