import type { Meta, StoryObj } from '@storybook/react'
import PricedServicesBlock from './PricedServicesBlock'

const meta = {
  title: 'Blocks/PricedServicesBlock',
  component: PricedServicesBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PricedServicesBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    _type: 'pricedServicesBlock',
    heading: 'Servicios de reparación',
    subtext:
      'Precios orientativos para las reparaciones más habituales. Escríbenos por WhatsApp para un presupuesto personalizado.',
    viewAllLabel: 'Ver todos los servicios y precios →',
    viewAllHref: '/servicios',
    serviceCards: [
      {
        title: 'Cambio de pantalla',
        description: 'Sustitución de pantalla rota o con fallos táctiles.',
        price: 'Desde 39€',
        ctaLabel: 'Pedir presupuesto',
        ctaHref: 'https://wa.me/34915550198',
      },
      {
        title: 'Cambio de batería',
        description: 'Batería nueva con garantía. Recupera la autonomía original.',
        price: 'Desde 29€',
        ctaLabel: 'Pedir presupuesto',
        ctaHref: 'https://wa.me/34915550198',
      },
      {
        title: 'Puerto de carga',
        description: 'Reparación o sustitución del conector de carga.',
        price: 'Desde 25€',
        ctaLabel: 'Pedir presupuesto',
        ctaHref: 'https://wa.me/34915550198',
      },
    ],
  },
}
