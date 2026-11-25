/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Monorepo uses strict `tsc --noEmit` in CI/lint scripts
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
