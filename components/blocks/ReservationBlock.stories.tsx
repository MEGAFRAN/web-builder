import type { Meta, StoryObj } from '@storybook/react'
import type { ReservationBlock as ReservationBlockProps } from '@/types/cms'
import ReservationBlock from './ReservationBlock'

const meta = {
  title: 'Blocks/ReservationBlock',
  component: ReservationBlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Multi-step reservation form: date → time slots → guest details. Availability is fetched when `clientId` is set (non-OK responses show all slots as available). Submit calls `/api/reservation`, which is not available in Storybook, so confirmation flows are best verified in the Next.js app or tests.',
      },
    },
  },
} satisfies Meta<typeof ReservationBlock>

export default meta
type Story = StoryObj<typeof meta>

const defaultArgs = {
  _type: 'reservationBlock',
  heading: 'Book a table',
  subtext: 'Choose a date and time. We will confirm by email.',
  minPartySize: 2,
  maxPartySize: 12,
  confirmationMessage:
    "Thanks — you're booked. We'll send details to your inbox.",
} satisfies ReservationBlockProps

export const Default: Story = {
  args: { ...defaultArgs },
}

export const MinimalCopy: Story = {
  args: {
    _type: 'reservationBlock',
  },
}

export const CustomScheduleAndPartySize: Story = {
  args: {
    ...defaultArgs,
    heading: 'Lunch & dinner',
    availableTimeSlots: ['12:00', '12:30', '19:00', '19:30', '20:00'],
    minPartySize: 1,
    maxPartySize: 8,
  },
}

/**
 * Triggers a fetch to `availabilityEndpoint` or `/api/availability` when a date is selected.
 * In Storybook the request typically fails; the block falls back to treating every slot as free.
 */
export const WithClientIdForAvailability: Story = {
  args: {
    ...defaultArgs,
    clientId: 'storybook-demo-client',
    availabilityEndpoint: '/api/availability',
  },
}
