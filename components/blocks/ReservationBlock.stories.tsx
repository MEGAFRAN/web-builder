import type { Meta, StoryObj } from '@storybook/react'
import type { ReservationBlock as ReservationBlockProps } from '@/types/cms'
import ReservationBlock from './ReservationBlock'

const demoServices = [
  {
    id: 'haircut',
    name: 'Haircut & finish',
    description: 'Wash, cut, and blow-dry.',
    durationMinutes: 45,
    price: 52,
    currency: '€',
  },
  {
    id: 'color',
    name: 'Colour refresh',
    description: 'Roots and toner refresh with conditioning treatment.',
    durationMinutes: 90,
    price: 98,
    currency: '€',
  },
] satisfies NonNullable<ReservationBlockProps['services']>

const meta = {
  title: 'Blocks/ReservationBlock',
  component: ReservationBlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Appointment-style booking: service → date & time slots → guest details. Availability requests include `duration` when `clientId` is set. Submit calls `/api/reservation`, which is not wired in Storybook, so confirmation flows are best verified in the Next.js app or tests.',
      },
    },
  },
} satisfies Meta<typeof ReservationBlock>

export default meta
type Story = StoryObj<typeof meta>

const defaultArgs = {
  _type: 'reservationBlock',
  heading: 'Book an appointment',
  subtext: 'Choose a service, then pick a date and time. We confirm by email.',
  services: demoServices,
  confirmationMessage:
    "Thanks — you're booked. We'll send details to your inbox.",
} satisfies ReservationBlockProps

export const Default: Story = {
  args: { ...defaultArgs },
}

export const MinimalCopy: Story = {
  args: {
    _type: 'reservationBlock',
    services: demoServices,
  },
}

export const SingleService: Story = {
  args: {
    ...defaultArgs,
    heading: 'Massage booking',
    services: [
      {
        id: 'swedish',
        name: 'Swedish massage',
        description: 'Full-body relaxation massage.',
        durationMinutes: 60,
        price: 55,
        currency: '€',
      },
    ],
  },
}

/**
 * Triggers a fetch to `availabilityEndpoint` or `/api/availability` when a date is selected (after a service).
 * In Storybook the request typically fails; the block falls back to treating every slot as free.
 */
export const WithClientIdForAvailability: Story = {
  args: {
    ...defaultArgs,
    clientId: 'storybook-demo-client',
    availabilityEndpoint: '/api/availability',
  },
}
