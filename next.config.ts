import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workers do not support the timer behavior used by Cache Components.
  // Classroom data is fetched per request; no persistent Next.js cache is needed.
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
