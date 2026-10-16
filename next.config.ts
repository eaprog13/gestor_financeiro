import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The repo has other unrelated projects (and lockfiles) above this folder;
  // pin the workspace root so Turbopack doesn't try to infer it.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Sem isto, o Next manda "X-Powered-By: Next.js" em toda a resposta — não
  // há razão para anunciar a framework a quem estiver a sondar o site.
  poweredByHeader: false,
};

export default nextConfig;
