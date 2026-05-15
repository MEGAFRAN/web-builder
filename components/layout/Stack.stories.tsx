import type { Meta, StoryObj } from '@storybook/react'
import { Stack } from './Stack'
import { Badge } from '@/components/content/Badge'

const meta = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  argTypes: {
    gap: { control: 'select', options: ['none', 'sm', 'md', 'lg', 'xl'] },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch'] },
  },
} satisfies Meta<typeof Stack>

export default meta
type Story = StoryObj<typeof meta>

const items = (
  <>
    <Badge label="First" />
    <Badge label="Second" />
    <Badge label="Third" />
  </>
)

export const Default: Story = { args: { gap: 'md', children: items } }
export const TightGap: Story = { args: { gap: 'sm', children: items } }
export const WideGap: Story = { args: { gap: 'xl', children: items } }
export const Centered: Story = { args: { gap: 'md', align: 'center', children: items } }
