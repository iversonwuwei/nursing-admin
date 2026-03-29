import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/health-monitoring",
        destination: "/health",
        permanent: false,
      },
      {
        source: "/data-dashboard",
        destination: "/analytics",
        permanent: false,
      },
      {
        source: "/equipment/:path*",
        destination: "/devices/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
