import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["intelligent-audit-trail", "isolation-forest"],
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.etsystatic.com', 
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'orglqrysnwosbvycyeya.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
