import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: process.env.DEPLOY_TARGET === 'blob',
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
  allowedDevOrigins: ['127.0.0.1', '192.168.1.131'],
}

export default nextConfig
