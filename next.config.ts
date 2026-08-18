import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The repo has other unrelated projects (and lockfiles) above this folder;
  // pin the workspace root so Turbopack doesn't try to infer it.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
