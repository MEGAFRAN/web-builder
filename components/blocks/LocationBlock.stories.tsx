import type { Meta, StoryObj } from '@storybook/react'
import LocationBlock from './LocationBlock'

const meta = {
  title: 'Blocks/LocationBlock',
  component: LocationBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LocationBlock>

export default meta
type Story = StoryObj<typeof meta>

export const NoMap: Story = {
  args: {
    _type: 'location',
    title: 'Find us',
    showMap: false,
    address: 'Calle Mayor 1, 28001 Madrid, Spain',
  },
}
