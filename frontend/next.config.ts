import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
  ...(isGithubPages
    ? {
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
        images: {
          unoptimized: true,
        },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
