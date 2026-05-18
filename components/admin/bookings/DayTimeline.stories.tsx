import type { Meta, StoryObj } from '@storybook/react'
import { DayTimeline } from './DayTimeline'
import { mockReservation } from './admin-components.stories.fixtures'

const meta = {
  title: 'Admin/DayTimeline',
  component: DayTimeline,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DayTimeline>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

const openMin = 9 * 60
const closeMin = 17 * 60
const ppm = 1.5
const timelineHeight = (closeMin - openMin) * ppm

export const SingleDay: Story = {
  args: {
    openMin,
    closeMin,
    ppm,
    timelineHeight,
    rows: [
      mockReservation({ id: 'a', time: '10:00', durationMinutes: 45 }),
      mockReservation({
        id: 'b',
        name: 'Alex Kim',
        time: '13:00',
        durationMinutes: 60,
        serviceName: 'Color',
        status: 'pending',
      }),
      mockReservation({
        id: 'c',
        name: 'Sam Rivera',
        time: '15:30',
        durationMinutes: 30,
        serviceName: 'Trim',
        status: 'cancelled',
      }),
    ],
    onSelect: noop,
  },
}
