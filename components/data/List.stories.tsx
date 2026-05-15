import type { Meta, StoryObj } from '@storybook/react'
import { List } from './List'

const meta = {
  title: 'Data/List',
  component: List,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'base', 'lg'] },
  },
} satisfies Meta<typeof List>

export default meta
type Story = StoryObj<typeof meta>

const items = ['First item', 'Second item', 'Third item', 'Fourth item']

export const Unordered: Story = { args: { items, ordered: false } }
export const Ordered: Story = { args: { items, ordered: true } }
export const Small: Story = { args: { items, size: 'sm' } }
export const Large: Story = { args: { items, size: 'lg' } }
