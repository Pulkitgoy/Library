import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns:[
      {
        protocol:"https",
        hostname:"placehold.co"
      },
      {
        protocol:"https",
        hostname:"m.media-amazon.com"
      }
    ]
  },
  allowedDevOrigins: ['192.168.59.1', 'localhost:3000']
};

export default nextConfig;
