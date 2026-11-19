import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents / partialPrefetching are off: every screen sits behind sign-in
  // and renders per user, so static prerendering brings nothing here.
  // Shared workspace packages (types, later the engine) are compiled by Next.
  transpilePackages: ["@omnimax/shared", "@omnimax/engine"],
  turbopack: {
    // Monorepo: dependencies are installed at the repo root.
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
