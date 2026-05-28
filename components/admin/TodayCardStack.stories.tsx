import type { Meta, StoryObj } from '@storybook/react'
import { TodayCardStack } from './TodayCardStack'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'
import type { AdminBookingService } from '@/types/admin'

const sampleServices: AdminBookingService[] = [
  {
    id: 'svc-cut',
    name: 'Haircut & Blow Dry',
    description: '',
    durationMinutes: 45,
    price: 45,
    currency: '$',
  },
]

const meta = {
  title: 'Admin/TodayCardStack',
  component: TodayCardStack,
  tags: ['autodocs'],
  args: {
    services: sampleServices,
    dateYmd: '2026-05-18',
    onPatchStatus: async () => {},
    onCreate: () => {},
  },
} satisfies Meta<typeof TodayCardStack>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    rows: [
      mockReservation({
        id: 'res-1',
        time: '10:00',
        durationMinutes: 45,
        name: 'Jordan Lee',
        phone: '+1 415 555 0100',
        serviceName: 'Haircut & Blow Dry',
        status: 'confirmed',
      }),
      mockReservation({
        id: 'res-2',
        time: '14:00',
        durationMinutes: 45,
        name: 'Alex Rivera',
        phone: '+1 415 555 0199',
        serviceName: 'Haircut & Blow Dry',
        status: 'pending',
      }),
    ],
  },
}

export const EmptyToday: Story = {
  args: {
    rows: [],
  },
}

export const ClosedDay: Story = {
  args: {
    rows: [],
    closedDay: true,
  },
}

export const CompletedBooking: Story = {
  args: {
    rows: [
      mockReservation({
        status: 'completed',
        name: 'Sam Ortiz',
      }),
    ],
  },
}

export const GuaranteeNoShow: Story = {
  args: {
    guaranteeEnabled: true,
    onNoShowCharge: async () => {},
    rows: [
      mockReservation({
        guarantee: {
          paymentMethodId: 'pm_123',
          customerId: 'cus_123',
          status: 'vaulted',
        },
      }),
    ],
  },
}
