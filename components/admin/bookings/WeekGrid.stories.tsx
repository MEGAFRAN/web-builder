import type { Meta, StoryObj } from '@storybook/react'
import { WeekGrid } from './WeekGrid'
import { mockReservation } from './admin-components.stories.fixtures'

const meta = {
  title: 'Admin/WeekGrid',
  component: WeekGrid,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof WeekGrid>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

/** Week of Mon 2026-05-18 */
const weekStart = '2026-05-18'

export const WeekWithBookings: Story = {
  args: {
    weekStart,
    rows: [
      mockReservation({ id: 'mon', date: '2026-05-18', time: '10:00' }),
      mockReservation({
        id: 'tue',
        date: '2026-05-19',
        time: '14:00',
        name: 'Chris Owen',
        serviceName: 'Beard trim',
      }),
      mockReservation({
        id: 'wed-am',
        date: '2026-05-20',
        time: '09:30',
      }),
      mockReservation({
        id: 'wed-pm',
        date: '2026-05-20',
        time: '16:00',
        status: 'pending',
      }),
      mockReservation({ id: 'fri', date: '2026-05-22', time: '12:00', status: 'cancelled' }),
    ],
    onPickDay: noop,
    onSelect: noop,
  },
}

export const EmptyWeek: Story = {
  args: {
    weekStart,
    rows: [],
    onPickDay: noop,
    onSelect: noop,
  },
}
