/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Alt tab sırasında sayfa yenilenmesini önlemek için
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig
