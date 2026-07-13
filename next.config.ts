import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for Docker.
  // Run with `node server.js`; public/ and .next/static/ are not included
  // and must be copied in alongside it (the Dockerfile does this).
  output: "standalone",
};

export default nextConfig;
