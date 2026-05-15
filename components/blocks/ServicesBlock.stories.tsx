import type { Meta, StoryObj } from '@storybook/react'
import ServicesBlock from './ServicesBlock'
import { mockServices, mockServicesWithSubItems } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/ServicesBlock',
  component: ServicesBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ServicesBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { _type: 'services', heading: 'Our Services', items: mockServices },
}
export const WithModal: Story = {
  args: {
    _type: 'services',
    heading: 'Massage Therapy',
    items: mockServicesWithSubItems,
    showModal: true,
    moreInfoLabel: 'View details',
  },
}
export const NoHeading: Story = {
  args: { _type: 'services', items: mockServices },
}
