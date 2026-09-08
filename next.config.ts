import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Deploy di balik subpath (Apache Laragon: /skp-dpupk). Lihat lib/base-path.ts.
  basePath: "/skp-dpupk",
};

export default nextConfig;
