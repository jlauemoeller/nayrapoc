import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pg-boss (and its `pg` driver) as a plain Node require instead of
  // letting the bundler inline it: it loads SQL and native-ish modules at
  // runtime that don't survive bundling.
  //
  // @blocknote/server-util pulls in @blocknote/react, which calls
  // `React.createContext` at module load. Bundled into a server layer it gets
  // Next's `react-server` build of React, which has no `createContext`.
  serverExternalPackages: ["pg-boss", "@blocknote/server-util"]
};

export default nextConfig;
