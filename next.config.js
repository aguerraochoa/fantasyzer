/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    // Allow local images from public folder
    remotePatterns: [],
  },
  // Enable Python API routes
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig

