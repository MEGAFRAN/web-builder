import type { Meta, StoryObj } from '@storybook/react'
import { Grid } from './Grid'
import { Card } from '@/components/data/Card'

const meta = {
  title: 'Layout/Grid',
  component: Grid,
  tags: ['autodocs'],
  argTypes: {
    cols: { control: 'select', options: ['1', '2', '3', '4'] },
    gap: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Grid>

export default meta
type Story = StoryObj<typeof meta>

const cards = (
  <>
    <Card title="Card 1" description="First card in the grid." />
    <Card title="Card 2" description="Second card in the grid." />
    <Card title="Card 3" description="Third card in the grid." />
    <Card title="Card 4" description="Fourth card in the grid." />
  </>
)

export const TwoCols: Story = { args: { cols: '2', gap: 'md', children: cards } }
export const ThreeCols: Story = { args: { cols: '3', gap: 'md', children: cards } }
export const FourCols: Story = { args: { cols: '4', gap: 'sm', children: cards } }
export const OneCol: Story = { args: { cols: '1', gap: 'md', children: cards } }
