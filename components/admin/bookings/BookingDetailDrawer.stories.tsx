import type { Meta, StoryObj } from '@storybook/react'
import { BookingDetailDrawer } from './BookingDetailDrawer'
import { mockReservation } from './admin-components.stories.fixtures'

const meta = {
  title: 'Admin/BookingDetailDrawer',
  component: BookingDetailDrawer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BookingDetailDrawer>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

export const Confirmed: Story = {
  args: {
    row: mockReservation(),
    onClose: noop,
    onCancel: noop,
    onNoShow: noop,
  },
}

export const Pending: Story = {
  args: {
    row: mockReservation({ id: 'res-p', status: 'pending', time: '15:30', durationMinutes: 60 }),
    onClose: noop,
    onCancel: noop,
    onNoShow: noop,
  },
}

export const Cancelled: Story = {
  args: {
    row: mockReservation({
      id: 'res-x',
      status: 'cancelled',
      notes: null,
    }),
    onClose: noop,
    onCancel: noop,
    onNoShow: noop,
  },
}

export const NoShow: Story = {
  args: {
    row: mockReservation({ id: 'res-n', status: 'no-show', durationMinutes: 30 }),
    onClose: noop,
    onCancel: noop,
    onNoShow: noop,
  },
}

/** Card on file + guarantee enabled → shows "Marcar no-show y cobrar" (primary button). */
export const WithGuaranteeCharge: Story = {
  args: {
    row: mockReservation({
      id: 'res-g',
      guarantee: { paymentMethodId: 'pm_mock_local_12345', status: 'vaulted' },
    }),
    guaranteeEnabled: true,
    onNoShowCharge: noop,
    onClose: noop,
    onCancel: noop,
    onNoShow: noop,
  },
}

export const ChargeFailed: Story = {
  args: {
    row: mockReservation({
      id: 'res-f',
      status: 'cancelled_charge_failed',
      cancelReason: 'Your card was declined.',
      guarantee: { paymentMethodId: 'pm_mock_local_12345', status: 'vaulted' },
    }),
    guaranteeEnabled: true,
    onNoShowCharge: noop,
    onClose: noop,
    onCancel: noop,
    onNoShow: noop,
  },
}
