/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    // Allow local images from public folder
    remotePatterns: [],
  },
  // Enable Python API routes
  // Server Actions are enabled by default in Next.js 14+
}

module.exports = nextConfig

