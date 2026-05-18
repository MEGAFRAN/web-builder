import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, type ReactNode } from 'react'
import { NewAppointmentModal } from './NewAppointmentModal'
import { storyClientId } from './admin-components.stories.fixtures'

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function WithAdminApiMock({ children }: { children: ReactNode }) {
  useEffect(() => {
    const orig = globalThis.fetch.bind(globalThis)
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input)

      if (url.includes('/api/admin/services')) {
        return new Response(
          JSON.stringify({
            services: [
              { id: 's1', name: 'Classic cut', durationMinutes: 30 },
              { id: 's2', name: 'Color treatment', durationMinutes: 90 },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.includes('/api/availability')) {
        return new Response(
          JSON.stringify({ bookedSlots: ['11:00'], outOfWindowSlots: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.includes('/api/admin/reservations') && init?.method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return orig(input, init)
    }
    return () => {
      globalThis.fetch = orig
    }
  }, [])
  return children
}

const meta = {
  title: 'Admin/NewAppointmentModal',
  component: NewAppointmentModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <WithAdminApiMock>
        <Story />
      </WithAdminApiMock>
    ),
  ],
} satisfies Meta<typeof NewAppointmentModal>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

export const Default: Story = {
  args: {
    clientId: storyClientId,
    initialDate: '2026-05-18',
    onClose: noop,
    onCreated: noop,
  },
}
