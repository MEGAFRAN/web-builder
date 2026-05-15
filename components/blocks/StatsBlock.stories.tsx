import type { Meta, StoryObj } from '@storybook/react'
import StatsBlock from './StatsBlock'
import { mockStats } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/StatsBlock',
  component: StatsBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    background: { control: 'select', options: ['white', 'gray', 'dark'] },
  },
} satisfies Meta<typeof StatsBlock>

export default meta
type Story = StoryObj<typeof meta>

export const White: Story = { args: { _type: 'statsBlock', stats: mockStats, background: 'white' } }
export const Gray: Story = { args: { _type: 'statsBlock', stats: mockStats, background: 'gray' } }
export const Dark: Story = { args: { _type: 'statsBlock', stats: mockStats, background: 'dark' } }
