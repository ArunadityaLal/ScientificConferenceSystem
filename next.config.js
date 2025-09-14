/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pg-native')
    }
    return config
  },
  
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  
  images: {
    domains: [
      'localhost',
      'conference-files.s3.amazonaws.com',
      'res.cloudinary.com',
      'uploadthing.com',
      'utfs.io'
    ],
  },
  
  // Disable experimental edge runtime warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig