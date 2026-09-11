import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pg-boss (and its `pg` driver) as a plain Node require instead of
  // letting the bundler inline it: it loads SQL and native-ish modules at
  // runtime that don't survive bundling.
  serverExternalPackages: ["pg-boss"]
};

export default nextConfig;
