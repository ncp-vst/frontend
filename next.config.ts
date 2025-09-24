// next.config.ts
import type { NextConfig } from "next";

const API_BASE = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? "http://49.50.130.15:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/freq-ingrdt/:path*", destination: `${API_BASE}/freq-ingrdt/:path*` },
      { source: "/freq-ingrdt", destination: `${API_BASE}/freq-ingrdt` },
      { source: "/freq-ingrdt/", destination: `${API_BASE}/freq-ingrdt/` },
      { source: "/auth/:path*", destination: `${API_BASE}/auth/:path*` },
      { source: "/auth", destination: `${API_BASE}/auth` },
      { source: "/auth/", destination: `${API_BASE}/auth/` },
    ];
  },
};

export default nextConfig;
