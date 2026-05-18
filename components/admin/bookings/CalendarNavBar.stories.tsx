import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { CalendarNavBar, type CalendarViewMode } from './CalendarNavBar'
import { formatYmd } from '@/lib/booking-utils'

const meta = {
  title: 'Admin/CalendarNavBar',
  component: CalendarNavBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CalendarNavBar>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

function CalendarNavBarDemo({ initialView }: { initialView: CalendarViewMode }) {
  const [selectedYmd, setSelectedYmd] = useState(() => formatYmd(new Date('2026-05-18')))
  const [view, setView] = useState<CalendarViewMode>(initialView)
  return (
    <CalendarNavBar
      selectedYmd={selectedYmd}
      onSelectedYmdChange={setSelectedYmd}
      view={view}
      onViewChange={setView}
    />
  )
}

export const Default: Story = {
  args: {
    selectedYmd: '2026-05-18',
    onSelectedYmdChange: noop,
    view: 'day',
    onViewChange: noop,
  },
  render: () => <CalendarNavBarDemo initialView="day" />,
}

export const WeekViewSelected: Story = {
  args: {
    selectedYmd: '2026-05-18',
    onSelectedYmdChange: noop,
    view: 'week',
    onViewChange: noop,
  },
  render: () => <CalendarNavBarDemo initialView="week" />,
}
