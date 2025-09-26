import type { NextConfig } from "next";

const API_BASE = "http://49.50.130.15:8080";
const CLOVA_BASE = "http://49.50.130.15:8000";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	output: "standalone",
	async rewrites() {
		return [
			{
				source: "/auth/:path*",
				destination: `${API_BASE}/auth/:path*`
			},
			{
				source: "/freq-ingrdt/:path*",
				destination: `${API_BASE}/freq-ingrdt/:path*`
			},
			{
				source: "/clova/:path*",
				destination: `${CLOVA_BASE}/:path*`
			}
		];
	},
};

export default nextConfig;
