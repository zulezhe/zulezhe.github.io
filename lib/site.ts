/**
 * ─────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the single file you edit to make this site yours.
 *  Change the values below, then push. Everything (SEO metadata,
 *  JSON-LD, RSS, llms.txt, sitemap…) picks them up automatically.
 * ─────────────────────────────────────────────────────────────────
 */

export interface GiscusConfig {
  /** e.g. "oliver/oliver.github.io" */
  repo: `${string}/${string}`
  repoId: string
  category: string
  categoryId: string
}

export const siteConfig = {
  /** Your name, used for titles, author metadata and JSON-LD. */
  name: "Oliver",

  /** Used for the home <title> and Open Graph tags. */
  title: "Oliver — Software Engineer & Writer",

  /** One-liner shown under your name on the home page. */
  tagline: "I build products for the web and write about how they work.",

  /** Default meta description (home page, RSS, llms.txt, JSON-LD). */
  description:
    "Personal website of Oliver — a software engineer sharing side projects, engineering notes, and practical guides about web development, SEO, and building for AI search.",

  /**
   * Canonical site URL WITHOUT a trailing slash.
   * - GitHub user site:        https://<user>.github.io
   * - GitHub project site:     https://<user>.github.io/<repo>
   * - Cloudflare Pages:        https://<project>.pages.dev
   * - Vercel:                  https://<project>.vercel.app
   * The GitHub Actions workflow sets this automatically via env.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://oliver.github.io").replace(/\/+$/, ""),

  /**
   * Sub path when the site is NOT served from the domain root
   * (GitHub project pages). Set automatically by the deploy workflow.
   */
  basePath: (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, ""),

  /** Content language — keep "en" for an international audience. */
  locale: "en",

  /** Social / contact links. Empty strings hide the icon in the footer. */
  links: {
    github: "https://github.com/oliver",
    twitter: "https://x.com/oliver",
    email: "mailto:hello@example.com",
  },

  /**
   * Comments powered by giscus (free, GitHub Discussions based).
   * 1. Enable Discussions on your repo, install https://giscus.app
   * 2. Fill in the four values below — comments appear on every post.
   */
  giscus: null as GiscusConfig | null,

  /**
   * Google Analytics 4 — paste your Measurement ID (e.g. "G-ABCDEF1234")
   * from analytics.google.com, or set NEXT_PUBLIC_GA_ID at build time.
   * Empty = the tracking script is not rendered at all.
   */
  analytics: {
    cloudflareBeacon: "",
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  },

  /** Google Search Console verification code (optional). */
  verification: {
    google: "",
  },
}

export type SiteConfig = typeof siteConfig

/** Absolute URL for a site path, basePath-aware, with sane trailing slashes. */
export function absUrl(path = "/"): string {
  let clean = path.startsWith("/") ? path : `/${path}`
  clean = clean.replace(/\/+$/, "") || "/"
  const base = `${siteConfig.url}${siteConfig.basePath}`
  if (clean === "/") return `${base}/`
  // Files (sitemap.xml, rss.xml, llms.txt…) keep no trailing slash.
  const looksLikeFile = /\.[a-z0-9]+$/i.test(clean)
  return looksLikeFile ? `${base}${clean}` : `${base}${clean}/`
}
