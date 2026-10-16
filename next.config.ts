import type { NextConfig } from 'next'

const supabase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  } catch {
    return undefined
  }
})()

const config: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol === 'http:' ? 'http' : 'https',
            hostname: supabase.hostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
}

export default config
