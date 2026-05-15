import type { Meta, StoryObj } from '@storybook/react'
import LogoCloudBlock from './LogoCloudBlock'
import { mockLogos } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/LogoCloudBlock',
  component: LogoCloudBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LogoCloudBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { _type: 'logoCloud', title: 'Trusted by leading companies', logos: mockLogos },
}
export const NoTitle: Story = {
  args: { _type: 'logoCloud', logos: mockLogos },
}
