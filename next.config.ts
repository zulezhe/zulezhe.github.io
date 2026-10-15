import type { NextConfig } from "next"

/**
 * Pure static export — `next build` produces a fully static `out/` folder
 * (HTML + CSS + JS) that can be hosted for free on GitHub Pages,
 * Cloudflare Pages, Vercel or Netlify with zero server runtime.
 *
 * NEXT_PUBLIC_BASE_PATH is only needed when hosting a repo under a sub path
 * (e.g. GitHub project pages at https://user.github.io/repo/).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: {
    // No image optimization server in static hosting — serve originals.
    unoptimized: true,
  },
}

export default nextConfig
