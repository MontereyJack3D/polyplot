import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@polyplot/core', '@polyplot/connectors'],
};

export default nextConfig;
