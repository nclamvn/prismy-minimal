/** @type {import('next').NextConfig} */
const nextConfig = {
  // Không cần experimental.appDir trong Next 15
  images: {
    domains: ['prismy.in'],
  }
}

module.exports = nextConfig
