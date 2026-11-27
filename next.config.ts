import type { NextConfig } from "next";

const PAWPATH_ORIGIN = process.env.PAWPATH_ORIGIN ?? "https://pawpath-ebon.vercel.app";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Pawpath is its own Vercel project (github.com/alrokosz/pawpath), built to live under
  // /pawpath/. This site forwards /pawpath to it, so it deploys on its own and none of its
  // build output lives in this repo. PAWPATH_ORIGIN points it elsewhere (e.g. a local preview).
  rewrites: async () => [
    { source: "/pawpath", destination: `${PAWPATH_ORIGIN}/pawpath` },
    { source: "/pawpath/:path*", destination: `${PAWPATH_ORIGIN}/pawpath/:path*` },
  ],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
