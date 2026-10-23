import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for Docker.
  // Run with `node server.js`; public/ and .next/static/ are not included
  // and must be copied in alongside it (the Dockerfile does this).
  output: "standalone",
  // No need to advertise the framework in every response.
  poweredByHeader: false,
};

export default nextConfig;
