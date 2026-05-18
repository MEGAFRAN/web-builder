import type { Meta, StoryObj } from '@storybook/react'
import { BookingCard } from './BookingCard'
import { mockReservation } from './admin-components.stories.fixtures'

const meta = {
  title: 'Admin/BookingCard',
  component: BookingCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BookingCard>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

export const ListConfirmed: Story = {
  args: {
    row: mockReservation(),
    variant: 'list',
    onClick: noop,
  },
}

export const ListPending: Story = {
  args: {
    row: mockReservation({ id: 'res-p', status: 'pending' }),
    variant: 'list',
    onClick: noop,
  },
}

export const ListCancelled: Story = {
  args: {
    row: mockReservation({ id: 'res-c', status: 'cancelled' }),
    variant: 'list',
    onClick: noop,
  },
}

export const Timeline: Story = {
  args: {
    row: mockReservation({ time: '14:00', durationMinutes: 60 }),
    variant: 'timeline',
    endLabel: '15:00',
    onClick: noop,
  },
  decorators: [
    (Story) => (
      <div className="h-24 w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
}

export const Week: Story = {
  args: {
    row: mockReservation({ time: '09:30' }),
    variant: 'week',
    onClick: noop,
  },
}
