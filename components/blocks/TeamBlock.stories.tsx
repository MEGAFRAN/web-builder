import type { Meta, StoryObj } from '@storybook/react'
import TeamBlock from './TeamBlock'
import { mockTeamMembers } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/TeamBlock',
  component: TeamBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TeamBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { _type: 'teamBlock', heading: 'Meet the team', members: mockTeamMembers },
}
export const NoHeading: Story = {
  args: { _type: 'teamBlock', members: mockTeamMembers },
}
