import type { Meta, StoryObj } from '@storybook/react'
import DividerBlock from './DividerBlock'

const meta = {
  title: 'Blocks/DividerBlock',
  component: DividerBlock,
  tags: ['autodocs'],
} satisfies Meta<typeof DividerBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { _type: 'divider' } }
