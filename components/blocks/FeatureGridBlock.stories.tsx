import type { Meta, StoryObj } from '@storybook/react'
import FeatureGridBlock from './FeatureGridBlock'
import { mockFeatures } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/FeatureGridBlock',
  component: FeatureGridBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    cols: { control: 'select', options: ['2', '3'] },
    variant: { control: 'select', options: ['card', 'list'] },
  },
} satisfies Meta<typeof FeatureGridBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { _type: 'featureGridBlock', heading: 'Platform features', items: mockFeatures },
}
export const NoHeading: Story = {
  args: { _type: 'featureGridBlock', items: mockFeatures.slice(0, 3) },
}
export const ListVariant: Story = {
  args: {
    _type: 'featureGridBlock',
    heading: 'Qué incluye tu web',
    subtitle: 'Todo lo que necesita tu negocio — sin complicaciones.',
    variant: 'list',
    items: mockFeatures,
  },
}
export const WithSubtitle: Story = {
  args: {
    _type: 'featureGridBlock',
    heading: 'Platform features',
    subtitle: 'Everything you need to succeed.',
    items: mockFeatures.slice(0, 3),
    cols: '3',
  },
}
