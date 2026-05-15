import type { Meta, StoryObj } from '@storybook/react'
import BlogListBlock from './BlogListBlock'

const meta = {
  title: 'Blocks/BlogListBlock',
  component: BlogListBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BlogListBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { _type: 'blog_list', postsPerPage: 6 },
}
