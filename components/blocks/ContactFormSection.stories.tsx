import type { Meta, StoryObj } from '@storybook/react'
import ContactFormSection from './ContactFormSection'

const meta = {
  title: 'Blocks/ContactFormSection',
  component: ContactFormSection,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContactFormSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: {} }
export const WithFallbackEmail: Story = {
  args: { fallbackEmail: 'hello@acme.com' },
}
