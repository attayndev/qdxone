import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the multi-tenant dev hosts (apex + any <slug>.lvh.me store) to load
  // dev resources / call server actions. Wildcard is supported.
  allowedDevOrigins: ["lvh.me", "*.lvh.me"],
};

export default nextConfig;
