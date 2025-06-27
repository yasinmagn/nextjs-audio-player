/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Enable experimental features if needed
  experimental: {
    // Enable if you need server components
    // appDir: true,
  },
  // Configure headers for CORS if needed
  async headers() {
    return [
      {
        // Apply headers to audio files
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // Image domains if you plan to show album artwork
  images: {
    domains: [
      'localhost',
      // Add your API domain here
      // 'your-api-domain.com'
    ],
  },
};

module.exports = nextConfig;
