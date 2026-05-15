import type { Preview, Decorator } from '@storybook/react'
import React from 'react'
import '../app/globals.css'
import { THEME_PRESETS } from '../lib/theme-presets'
import { buildThemeStyles } from '../lib/theme-utils'

const withTheme: Decorator = (Story, context) => {
  const preset =
    THEME_PRESETS[context.globals.theme as string] ?? THEME_PRESETS['default']
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('style', {
      dangerouslySetInnerHTML: { __html: buildThemeStyles(preset) },
    }),
    React.createElement(Story),
  )
}

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Select a theme preset',
      defaultValue: 'default',
      toolbar: {
        icon: 'paintbrush',
        items: Object.keys(THEME_PRESETS).map((name) => ({
          value: name,
          title: name,
        })),
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  parameters: {
    nextjs: { appDirectory: true },
    backgrounds: {
      default: 'theme',
      values: [
        { name: 'theme', value: 'var(--color-bg)' },
        { name: 'white', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
