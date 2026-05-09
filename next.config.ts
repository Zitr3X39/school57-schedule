import type { NextConfig } from "next";

// Set BUILD_TARGET=pages when building for GitHub Pages so we get static
// export + the right basePath (the repo name). Local dev (`pnpm dev`) and
// regular `pnpm build` keep working without basePath.
const PAGES_BUILD = process.env.BUILD_TARGET === "pages";

const nextConfig: NextConfig = {
  ...(PAGES_BUILD
    ? {
        output: "export",
        basePath: "/school57-schedule",
        // Asset paths must include basePath; client fetches read this too.
        env: {
          NEXT_PUBLIC_BASE_PATH: "/school57-schedule",
        },
        images: {
          unoptimized: true,
        },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
