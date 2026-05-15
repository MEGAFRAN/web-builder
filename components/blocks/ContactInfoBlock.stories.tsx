import type { Meta, StoryObj } from '@storybook/react'
import ContactInfoBlock from './ContactInfoBlock'

const meta = {
  title: 'Blocks/ContactInfoBlock',
  component: ContactInfoBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContactInfoBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Full: Story = {
  args: {
    _type: 'contactInfoBlock',
    email: 'hello@acme.com',
    phone: '+34 600 000 000',
    address: 'Calle Mayor 1, Madrid, Spain',
  },
}
export const PhoneAndEmail: Story = {
  args: { _type: 'contactInfoBlock', email: 'hello@acme.com', phone: '+34 600 000 000' },
}
