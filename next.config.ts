import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The old catalog page moved to /menu in the 2026-10 redesign.
  async redirects() {
    return [{ source: "/katalog", destination: "/menu", permanent: true }];
  },
  images: {
    // Product photos from Supabase Storage (public bucket).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
