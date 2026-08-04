import type { Meta, StoryObj } from '@storybook/react'
import ProductExampleBlock from './ProductExampleBlock'

const meta = {
  title: 'Blocks/ProductExampleBlock',
  component: ProductExampleBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProductExampleBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    _type: 'productExampleBlock',
    heading: 'Así se ve una web Clubtal',
    imageUrl: '/clients/clubtal/clubtal-mobile.webp',
    imageAlt: 'iPhone mostrando un ejemplo real de web Clubtal',
  },
}

export const WithHref: Story = {
  args: {
    _type: 'productExampleBlock',
    heading: 'Así se ve una web Clubtal',
    imageUrl: '/clients/clubtal/clubtal-mobile.webp',
    imageAlt: 'iPhone mostrando un ejemplo real de web Clubtal',
    href: 'https://moviles.clubtal.com',
  },
}
