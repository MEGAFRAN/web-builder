import type { NextConfig } from 'next'
import { getLocalIpv4Addresses } from './scripts/get-local-ipv4-addresses.mjs'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  ...(isDev ? {} : { output: 'export' }),
  trailingSlash: process.env.DEPLOY_TARGET === 'blob',
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
  ...(isDev
    ? {
        allowedDevOrigins: [
          '127.0.0.1',
          'localhost',
          ...getLocalIpv4Addresses().map(({ address }) => address),
        ],
      }
    : {}),
}

export default nextConfig
