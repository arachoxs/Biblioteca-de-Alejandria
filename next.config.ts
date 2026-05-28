import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "aaadijmkflfckmoluiex.supabase.co",
      },
    ],
  },
};

export default nextConfig;
