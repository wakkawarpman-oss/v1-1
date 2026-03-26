/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'X-Frame-Options',          value: 'DENY' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'serial=()',
      'bluetooth=()',
      'hid=()',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()',
      'ambient-light-sensor=()',
    ].join(', '),
  },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Next.js App Router requires 'unsafe-inline' for hydration scripts.
    // Removing it requires nonce-based CSP via middleware — deferred.
    // frame-ancestors + form-action + object-src 'none' still meaningfully constrain
    // the attack surface. worker-src and manifest-src are explicit to avoid
    // falling through to script-src.
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig = {
  outputFileTracingRoot: require('node:path').join(__dirname),
  transpilePackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

module.exports = nextConfig
