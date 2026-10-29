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
   * Canonical site URL WITHOUT a trailing slash — the custom domain the
   * site is actually served from. Keep this in sync with the GitHub Actions
   * workflow's NEXT_PUBLIC_SITE_URL.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dyzyzj.top").replace(/\/+$/, ""),

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
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "G-Z8XEE5MVPC",
  },

  /** Google Search Console verification code (optional). */
  verification: {
    google: "",
  },
}

export type SiteConfig = typeof siteConfig

/**
 * Build page-level metadata with a complete Open Graph + Twitter block.
 *
 * Why: Next.js shallow-merges `openGraph` / `twitter` per route segment, so a
 * page that only overrides `title` and `description` silently inherits the
 * root layout's `og:url`, `og:title`… — making every non-home page advertise
 * itself as the homepage. This helper always emits the full block.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  ogImage,
  publishedTime,
  modifiedTime,
  tags,
  languages,
}: {
  title: string
  description: string
  path: string
  type?: "website" | "article"
  ogImage?: { url: string; alt?: string }
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  languages?: Record<string, string>
}) {
  const canonical = absolutePageUrl(path)
  const image = ogImage ?? {
    url: absUrl("/opengraph-image"),
    alt: `${siteConfig.name} — ${siteConfig.tagline}`,
  }

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      type,
      siteName: siteConfig.name,
      locale: "en_US",
      url: canonical,
      title,
      description,
      images: [{ url: image.url, width: 1200, height: 630, alt: image.alt ?? title }],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime: modifiedTime ?? publishedTime,
            authors: [siteConfig.name],
            tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [{ url: image.url, alt: image.alt ?? title }],
    },
  }
}

/** Absolute URL for a site path, basePath-aware, with sane trailing slashes. */
export function absUrl(path = "/"): string {
  const base = `${siteConfig.url}${siteConfig.basePath}`

  // Split off a fragment/hash so `#id` anchors aren't mistaken for path text.
  const hashIndex = path.indexOf("#")
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex)
  let clean = (hashIndex === -1 ? path : path.slice(0, hashIndex)) || "/"
  if (!clean.startsWith("/")) clean = `/${clean}`
  clean = clean.replace(/\/+$/, "") || "/"

  if (clean === "/") return `${base}/${hash}`
  // Files (sitemap.xml, rss.xml, llms.txt, opengraph-image…) keep no trailing slash.
  const looksLikeFile = /\.[a-z0-9]+$/i.test(clean) || /\/opengraph-image$/.test(clean)
  return looksLikeFile ? `${base}${clean}${hash}` : `${base}${clean}/${hash}`
}

/**
 * Absolute canonical URL for a page path.
 *
 * Unlike `absUrl`, this always trails a page with `/` so in-route canonical
 * links, `og:url`, sitemap entries and hreflang values stay byte-identical
 * (mismatched slash variants are a common cause of duplicate-URL signals).
 * Absolute URLs passed in (e.g. a syndicated `post.canonical`) are returned
 * verbatim so mirrors keep pointing at their original home.
 */
export function absolutePageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return absUrl(path)
}
