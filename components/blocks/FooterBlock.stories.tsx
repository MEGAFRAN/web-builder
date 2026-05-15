import type { Meta, StoryObj } from '@storybook/react'
import FooterBlock from './FooterBlock'
import { mockFooterColumns } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/FooterBlock',
  component: FooterBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FooterBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { _type: 'footer', columns: mockFooterColumns, copyright: '© 2025 Acme Corp. All rights reserved.' },
}
export const CopyrightOnly: Story = {
  args: { _type: 'footer', copyright: '© 2025 Acme Corp.' },
}
