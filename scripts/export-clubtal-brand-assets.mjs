/**
 * Renders Clubtal WhatsApp Business profile photo at native 640×640.
 * Wordmark on white — matches business/brand/clubtal-brand.md Surfaces Checklist.
 * Does NOT upscale favicon/apple-icon.
 *
 * Usage: npm run generate:clubtal-assets
 */
import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { ImageResponse } from 'next/og.js'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const targetDir = path.join(root, 'public/clients/clubtal')
const outPath = path.join(targetDir, 'whatsapp-profile.png')
const fontPath = path.join(root, 'assets/fonts/inter/Inter-SemiBold.woff')

const SIZE = 640
const PRIMARY = '#111827'
const BACKGROUND = '#ffffff'
const BORDER = '#e5e7eb'
const SAFE_DIAMETER = Math.round(SIZE * 0.85)
const FONT_SIZE = Math.round(SIZE * 0.15)
const BORDER_WIDTH = Math.max(2, Math.round(SIZE * 0.00625))

if (!fs.existsSync(fontPath)) {
  console.error(`[clubtal-assets] missing font: ${path.relative(root, fontPath)}`)
  process.exit(1)
}

const fontData = fs.readFileSync(fontPath)

const element = createElement(
  'div',
  {
    style: {
      width: SIZE,
      height: SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: BACKGROUND,
      fontFamily: 'Inter',
    },
  },
  createElement(
    'div',
    {
      style: {
        width: SIZE,
        height: SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `${BORDER_WIDTH}px solid ${BORDER}`,
        boxSizing: 'border-box',
      },
    },
    createElement(
      'div',
      {
        style: {
          width: SAFE_DIAMETER,
          height: SAFE_DIAMETER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
      createElement(
        'span',
        {
          style: {
            color: PRIMARY,
            fontSize: FONT_SIZE,
            fontWeight: 600,
            fontFamily: 'Inter',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          },
        },
        'clubtal',
      ),
    ),
  ),
)

const response = new ImageResponse(element, {
  width: SIZE,
  height: SIZE,
  fonts: [
    {
      name: 'Inter',
      data: fontData,
      weight: 600,
      style: 'normal',
    },
  ],
})

const buffer = Buffer.from(await response.arrayBuffer())
fs.mkdirSync(targetDir, { recursive: true })
fs.writeFileSync(outPath, buffer)

console.log(`[clubtal-assets] wrote ${path.relative(root, outPath)} (${SIZE}×${SIZE}, native)`)
