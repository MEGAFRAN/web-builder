import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(ts|tsx)',
    '../stories/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.plugins ??= []
    config.plugins.push(tailwindcss())
    config.resolve ??= {}
    config.resolve.alias = {
      ...config.resolve.alias,
      // Path alias from tsconfig
      '@': path.resolve(__dirname, '..'),
      // Mock next/link as a plain <a> so Navbar/BottomCtaBar render in Storybook
      'next/link': path.resolve(__dirname, './mocks/next-link.tsx'),
      // Prevent any other next/* internals from crashing the Vite build
      'next/navigation': path.resolve(__dirname, './mocks/next-navigation.ts'),
      'next/router': path.resolve(__dirname, './mocks/next-router.ts'),
    }
    return config
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
}

export default config
