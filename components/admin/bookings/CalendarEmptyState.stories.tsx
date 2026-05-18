import type { Meta, StoryObj } from '@storybook/react'
import { CalendarEmptyState } from './CalendarEmptyState'

const meta = {
  title: 'Admin/CalendarEmptyState',
  component: CalendarEmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CalendarEmptyState>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

export const EmptyDay: Story = {
  args: {
    variant: 'empty',
    onCreate: noop,
  },
}

export const ClosedDay: Story = {
  args: {
    variant: 'closed',
    dateLabel: 'Mon, May 18',
    onCreate: noop,
  },
}
