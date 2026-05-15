import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta = {
  title: 'Content/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const InitialsSm: Story = { args: { name: 'Alice Johnson', size: 'sm' } }
export const InitialsMd: Story = { args: { name: 'Bob Martínez', size: 'md' } }
export const InitialsLg: Story = { args: { name: 'Clara Lee', size: 'lg' } }
export const WithImage: Story = {
  args: {
    name: 'David Alba',
    src: 'https://picsum.photos/seed/avatar/80/80',
    size: 'md',
  },
}
