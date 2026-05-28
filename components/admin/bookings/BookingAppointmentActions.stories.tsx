import type { Meta, StoryObj } from '@storybook/react'
import { BookingAppointmentActions } from './BookingAppointmentActions'
import { mockReservation } from './admin-components.stories.fixtures'

const meta = {
  title: 'Admin/BookingAppointmentActions',
  component: BookingAppointmentActions,
  tags: ['autodocs'],
  argTypes: {
    layout: { control: 'select', options: ['inline', 'stacked'] },
  },
  args: {
    onPatchStatus: async () => {},
  },
} satisfies Meta<typeof BookingAppointmentActions>

export default meta
type Story = StoryObj<typeof meta>

export const Inline: Story = {
  args: {
    row: mockReservation({ phone: '+1 415 555 0100' }),
    layout: 'inline',
  },
}

export const Stacked: Story = {
  args: {
    row: mockReservation({ phone: '+1 415 555 0100' }),
    layout: 'stacked',
  },
}

export const GuaranteeChargeInline: Story = {
  args: {
    row: mockReservation({
      guarantee: { paymentMethodId: 'pm_mock_local_12345', status: 'vaulted' },
    }),
    layout: 'inline',
    guaranteeEnabled: true,
    onNoShowCharge: async () => {},
  },
}

export const GuaranteeChargeStacked: Story = {
  args: {
    row: mockReservation({
      guarantee: { paymentMethodId: 'pm_mock_local_12345', status: 'vaulted' },
    }),
    layout: 'stacked',
    guaranteeEnabled: true,
    onNoShowCharge: async () => {},
  },
}

export const CompletedDisabled: Story = {
  args: {
    row: mockReservation({ status: 'completed' }),
    layout: 'inline',
  },
}

export const NoPhone: Story = {
  args: {
    row: mockReservation({ phone: '' }),
    layout: 'stacked',
  },
}
