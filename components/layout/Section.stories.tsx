import type { Meta, StoryObj } from '@storybook/react'
import { Section } from './Section'

const meta = {
  title: 'Layout/Section',
  component: Section,
  tags: ['autodocs'],
  argTypes: {
    background: { control: 'select', options: ['white', 'gray', 'dark'] },
    paddingY: { control: 'select', options: ['none', 'sm', 'md', 'lg', 'xl'] },
  },
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

const content = <p style={{ padding: '0 2rem', color: 'inherit' }}>Section content goes here.</p>

export const White: Story = { args: { background: 'white', paddingY: 'lg', children: content } }
export const Gray: Story = { args: { background: 'gray', paddingY: 'lg', children: content } }
export const Dark: Story = { args: { background: 'dark', paddingY: 'lg', children: content } }
export const NoPadding: Story = { args: { background: 'white', paddingY: 'none', children: content } }
export const ExtraLarge: Story = { args: { background: 'gray', paddingY: 'xl', children: content } }
