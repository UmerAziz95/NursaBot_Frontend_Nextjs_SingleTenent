import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
// Prefer 127.0.0.1 over localhost — on Windows, localhost often resolves to ::1,
// which can hit a different service (e.g. Docker) than Laravel on 127.0.0.1:8001.
const laravelOrigin = (process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.LARAVEL_URL || 'http://127.0.0.1:8001')
  .replace(/\/$/, '')
  .replace(/^http:\/\/localhost(?=:\d+|$)/i, 'http://127.0.0.1')

const nextConfig = {
  // Ensure Turbopack resolves the correct project root to avoid
  // "couldn't find the Next.js package from the project directory" errors.
  turbopack: {
    // use absolute project folder
    root: resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${laravelOrigin}/:path*`,
      },
    ]
  },
  reactCompiler: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
