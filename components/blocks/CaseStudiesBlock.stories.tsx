import type { Meta, StoryObj } from '@storybook/react'
import CaseStudiesBlock from './CaseStudiesBlock'
import { mockCaseStudies } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/CaseStudiesBlock',
  component: CaseStudiesBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CaseStudiesBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    _type: 'caseStudiesBlock',
    heading: 'Case studies',
    subtext: 'Real results for real businesses.',
    items: mockCaseStudies,
  },
}
export const NoHeader: Story = {
  args: { _type: 'caseStudiesBlock', items: mockCaseStudies },
}
