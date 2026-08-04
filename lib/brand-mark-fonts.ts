import fs from 'node:fs'
import path from 'node:path'

const FONT_DIR = path.join(process.cwd(), 'assets/fonts/inter')

function readFontFile(filename: string): ArrayBuffer {
  const buffer = fs.readFileSync(path.join(FONT_DIR, filename))
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

let regularCache: ArrayBuffer | null = null
let semiboldCache: ArrayBuffer | null = null

export function loadInterRegular(): ArrayBuffer {
  if (!regularCache) {
    regularCache = readFontFile('Inter-Regular.woff')
  }
  return regularCache
}

export function loadInterSemibold(): ArrayBuffer {
  if (!semiboldCache) {
    semiboldCache = readFontFile('Inter-SemiBold.woff')
  }
  return semiboldCache
}

export const interRegularFont = {
  name: 'Inter',
  weight: 400 as const,
  style: 'normal' as const,
}

export const interSemiboldFont = {
  name: 'Inter',
  weight: 600 as const,
  style: 'normal' as const,
}
