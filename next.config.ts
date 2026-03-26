import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Listing photos come from varied MLS/CDN hosts; chat uses <img> with object-cover
  // so we do not need images.remotePatterns for those URLs.
};

export default nextConfig;
