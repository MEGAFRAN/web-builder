import type { Meta, StoryObj } from '@storybook/react'
import ContactBlock from './ContactBlock'

const meta = {
  title: 'Blocks/ContactBlock',
  component: ContactBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContactBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    _type: 'contact',
    title: 'Get in touch',
    phone: '+34 600 000 000',
    email: 'hello@acme.com',
    address: 'Calle Mayor 1, Madrid, Spain',
  },
}
export const EmailOnly: Story = {
  args: { _type: 'contact', title: 'Contact us', email: 'hello@acme.com' },
}
