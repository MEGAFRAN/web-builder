import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
  allowedDevOrigins: ['127.0.0.1'],
}

export default nextConfig
