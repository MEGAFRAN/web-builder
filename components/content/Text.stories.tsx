import type { Meta, StoryObj } from '@storybook/react'
import { Text } from './Text'

const meta = {
  title: 'Content/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'base', 'lg', 'xl'] },
    color: { control: 'select', options: ['default', 'muted', 'white'] },
    weight: { control: 'select', options: ['normal', 'medium', 'semibold'] },
    align: { control: 'select', options: ['left', 'center', 'right'] },
  },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: { content: 'The quick brown fox jumps over the lazy dog.', size: 'base' },
}
export const Small: Story = {
  args: { content: 'Small text, great for captions and footnotes.', size: 'sm', color: 'muted' },
}
export const Large: Story = {
  args: { content: 'Large introductory paragraph with more visual weight.', size: 'lg' },
}
export const Semibold: Story = {
  args: { content: 'Semibold text draws the eye without being a heading.', weight: 'semibold' },
}
export const Centered: Story = {
  args: { content: 'This text is centered on its container.', align: 'center' },
}
