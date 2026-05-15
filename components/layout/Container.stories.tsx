import type { Meta, StoryObj } from '@storybook/react'
import { Container } from './Container'

const meta = {
  title: 'Layout/Container',
  component: Container,
  tags: ['autodocs'],
  argTypes: {
    maxWidth: { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl', 'full'] },
    padding: { control: 'select', options: ['theme', 'none', 'sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Container>

export default meta
type Story = StoryObj<typeof meta>

const inner = (
  <div style={{ background: 'rgba(0,0,0,0.05)', padding: '1rem', textAlign: 'center' }}>
    Container content
  </div>
)

export const Default: Story = { args: { maxWidth: 'xl', padding: 'theme', children: inner } }
export const Narrow: Story = { args: { maxWidth: 'md', padding: 'theme', children: inner } }
export const Wide: Story = { args: { maxWidth: '2xl', padding: 'theme', children: inner } }
export const FullWidth: Story = { args: { maxWidth: 'full', padding: 'none', children: inner } }
