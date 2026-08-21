import type { NextConfig } from "next";

const allowedImageDomains = (
  process.env.ALLOWED_IMAGE_DOMAINS || "graph.microsoft.com,sharepoint.com"
).split(",");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.sharepoint.com https://*.microsoft.com https://graph.microsoft.com; connect-src 'self' https://*.sharepoint.com https://*.microsoft.com https://graph.microsoft.com;",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: allowedImageDomains.map((domain) => ({
      protocol: "https",
      hostname: domain.trim(),
    })),
  },
};

export default nextConfig;
