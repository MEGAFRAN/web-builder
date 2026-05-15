import type { Meta, StoryObj } from '@storybook/react'
import { Table } from './Table'

const meta = {
  title: 'Data/Table',
  component: Table,
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const columns = ['Name', 'Role', 'Status']
const rows = [
  ['Alice Johnson', 'Designer', 'Active'],
  ['Bob Martínez', 'Developer', 'Active'],
  ['Clara Lee', 'Manager', 'On leave'],
  ['David Ortega', 'Analyst', 'Active'],
]

export const Default: Story = { args: { columns, rows } }
export const Striped: Story = { args: { columns, rows, striped: true } }
