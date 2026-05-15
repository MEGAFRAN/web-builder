import type { Meta, StoryObj } from '@storybook/react'
import { Heading } from './Heading'

const meta = {
  title: 'Content/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    level: { control: 'select', options: ['h1', 'h2', 'h3', 'h4'] },
    align: { control: 'select', options: ['left', 'center', 'right'] },
    color: { control: 'select', options: ['default', 'muted', 'white'] },
  },
} satisfies Meta<typeof Heading>

export default meta
type Story = StoryObj<typeof meta>

export const H1: Story = { args: { text: 'Page Title (H1)', level: 'h1' } }
export const H2: Story = { args: { text: 'Section Heading (H2)', level: 'h2' } }
export const H3: Story = { args: { text: 'Subsection (H3)', level: 'h3' } }
export const H4: Story = { args: { text: 'Card title (H4)', level: 'h4' } }
export const Centered: Story = { args: { text: 'Centered Heading', level: 'h2', align: 'center' } }
export const Muted: Story = { args: { text: 'Muted Heading', level: 'h2', color: 'muted' } }
