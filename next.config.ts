import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/today',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
