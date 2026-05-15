import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from './Alert'

const meta = {
  title: 'Content/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: { title: 'Heads up', message: 'Your session will expire in 5 minutes.', variant: 'info' },
}
export const Success: Story = {
  args: { title: 'All done!', message: 'Your changes have been saved successfully.', variant: 'success' },
}
export const Warning: Story = {
  args: { title: 'Warning', message: 'This action cannot be undone. Please review before continuing.', variant: 'warning' },
}
export const Error: Story = {
  args: { title: 'Error', message: 'Something went wrong. Please try again later.', variant: 'error' },
}
export const NoTitle: Story = {
  args: { message: 'A simple notice with no heading.', variant: 'info' },
}
