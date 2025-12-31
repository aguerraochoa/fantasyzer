/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: true,
  },
  // Enable Python API routes
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig

