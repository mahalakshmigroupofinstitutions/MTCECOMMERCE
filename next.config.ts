import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Vercel Blob's public URLs are always
        // https://<store-id>.public.blob.vercel-storage.com/<pathname> — the
        // store id is generated per Blob store and unknown until one exists,
        // so this wildcards the subdomain rather than hardcoding a guessed
        // value. This is the pattern Vercel's own docs use for this reason.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
