import type { Meta, StoryObj } from '@storybook/react'
import { Image } from './Image'

const meta = {
  title: 'Content/Image',
  component: Image,
  tags: ['autodocs'],
} satisfies Meta<typeof Image>

export default meta
type Story = StoryObj<typeof meta>

export const Fixed: Story = {
  args: { src: 'https://picsum.photos/seed/img1/400/300', alt: 'Sample landscape', width: 400, height: 300 },
}
export const Rounded: Story = {
  args: {
    src: 'https://picsum.photos/seed/avatar2/200/200',
    alt: 'Profile photo',
    width: 200,
    height: 200,
    rounded: true,
  },
}
export const FillMode: Story = {
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '600px', height: '300px' }}>
        <Story />
      </div>
    ),
  ],
  args: { src: 'https://picsum.photos/seed/fill1/800/400', alt: 'Fill mode image', fill: true },
}
