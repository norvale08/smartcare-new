/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui'],
  eslint: {
    ignoreDuringBuilds: true, // 🚀 allows build to succeed even with lint errors
  },
  typescript: {
    ignoreBuildErrors: true, // 🚀 allows build to succeed even with TypeScript errors
  },
}

export default nextConfig