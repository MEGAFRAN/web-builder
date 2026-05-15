import type { Meta, StoryObj } from '@storybook/react'
import FeatureGridBlock from './FeatureGridBlock'
import { mockFeatures } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/FeatureGridBlock',
  component: FeatureGridBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FeatureGridBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { _type: 'featureGridBlock', heading: 'Platform features', items: mockFeatures },
}
export const NoHeading: Story = {
  args: { _type: 'featureGridBlock', items: mockFeatures.slice(0, 3) },
}
