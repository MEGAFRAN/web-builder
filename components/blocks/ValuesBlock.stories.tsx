import type { Meta, StoryObj } from '@storybook/react'
import ValuesBlock from './ValuesBlock'

const meta = {
  title: 'Blocks/ValuesBlock',
  component: ValuesBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ValuesBlock>

export default meta
type Story = StoryObj<typeof meta>

const items = [
  { title: 'Integrity', description: 'We do what we say, and we say what we mean.', icon: '🤝' },
  { title: 'Innovation', description: 'We challenge assumptions and embrace change.', icon: '💡' },
  { title: 'Excellence', description: 'We hold ourselves to the highest standards.', icon: '🌟' },
]

export const Default: Story = {
  args: { _type: 'valuesBlock', heading: 'Our values', items },
}
export const NoHeading: Story = {
  args: { _type: 'valuesBlock', items },
}
