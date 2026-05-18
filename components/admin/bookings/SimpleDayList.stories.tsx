import type { Meta, StoryObj } from '@storybook/react'
import { SimpleDayList } from './SimpleDayList'
import { mockReservation } from './admin-components.stories.fixtures'

const meta = {
  title: 'Admin/SimpleDayList',
  component: SimpleDayList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SimpleDayList>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

export const WithAppointments: Story = {
  args: {
    rows: [
      mockReservation({ id: '1', time: '09:00' }),
      mockReservation({
        id: '2',
        name: 'Pat Quinn',
        time: '11:30',
        serviceName: 'Consultation',
        status: 'pending',
      }),
    ],
    onSelect: noop,
  },
}
