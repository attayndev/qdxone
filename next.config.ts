import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted on Fly.io as a Node server. `standalone` emits a minimal
  // server bundle (.next/standalone/server.js) for a small Docker image.
  // This runs the FULL Node.js runtime, so proxy.ts middleware works as-is
  // (the whole reason we're off Vercel — wildcard SSL is handled by Fly).
  output: "standalone",

  // Allow the multi-tenant dev hosts (apex + any <slug>.lvh.me store) to load
  // dev resources / call server actions. Wildcard is supported.
  allowedDevOrigins: ["lvh.me", "*.lvh.me"],
};

export default nextConfig;
