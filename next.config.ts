import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qrfdfgwbdxlyhnnnonkn.supabase.co",
        pathname: "/storage/v1/object/public/**",
        search: "",
      },
    ],
    minimumCacheTTL: 86400,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
