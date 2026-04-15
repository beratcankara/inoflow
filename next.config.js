/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Alt tab sırasında sayfa yenilenmesini önlemek için
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig
