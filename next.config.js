/** @type {import('next').NextConfig} */
const nextConfig = {
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

module.exports = nextConfig;
