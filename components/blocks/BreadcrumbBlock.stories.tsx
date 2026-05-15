import type { Meta, StoryObj } from '@storybook/react'
import BreadcrumbBlock from './BreadcrumbBlock'

const meta = {
  title: 'Blocks/BreadcrumbBlock',
  component: BreadcrumbBlock,
  tags: ['autodocs'],
} satisfies Meta<typeof BreadcrumbBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    _type: 'breadcrumb',
    items: [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: 'Hair & Style' }],
  },
}
