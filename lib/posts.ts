import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { locales, type Locale } from "@/lib/i18n/config"

const POSTS_DIR = path.join(process.cwd(), "content", "blog")
/** Sub-directory per non-English locale, e.g. content/blog/zh-TW/. Adding a
 *  locale to `locales` in lib/i18n/config.ts makes its directory resolvable
 *  here (same name as the locale tag by default). */
function localeDirName(locale: Locale): string {
  return locale === "en" ? "." : locale
}

export interface FaqItem {
  q: string
  a: string
}

export interface Post {
  slug: string
  title: string
  description: string
  /** ISO date string "YYYY-MM-DD" */
  date: string
  /** Optional ISO date string for meaningful updates */
  updated?: string
  tags: string[]
  featured: boolean
  draft: boolean
  faq: FaqItem[]
  /** Raw markdown source */
  content: string
  /** Slug of the English original when this file is a translation. */
  translationOf?: string
  /** Slugs of the sibling translations per locale, derived from files on disk. */
  translations?: Partial<Record<Locale, string>>
  language?: string
  interactive?: "ev-charging-europe" | "europe-earthquakes-ten-years" | "hk-ev-charging"
  /** Absolute URL of the canonical home when this post is a mirror (e.g. syndicated). */
  canonical?: string
  readingTime: number
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value ?? "").slice(0, 10)
}

function computeReadingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\-]/g, " ")
  const cjk = text.match(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/g)?.length ?? 0
  const words = text.replace(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, " ")
    .split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220 + cjk / 400))
}

function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\-]/g, " ")
  const cjk = text.match(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/g)?.length ?? 0
  return text.replace(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, " ")
    .split(/\s+/).filter(Boolean).length + cjk
}

function parseFile(fileName: string, dir: string, locale: Locale): Post {
  const slug = fileName.replace(/\.md$/i, "")
  const raw = fs.readFileSync(path.join(dir, fileName), "utf8")
  const { data, content } = matter(raw)

  const tagsRaw = Array.isArray(data.tags) ? data.tags : []
  const faqRaw = Array.isArray(data.faq) ? data.faq : []

  const translationOf = typeof data.translationOf === "string"
    ? data.translationOf
    : locale !== "en" ? slug : undefined

  const enSlug = translationOf ?? slug
  // A translation pair exists when the English original is on disk and this
  // file lives under a non-default locale directory. Generalized for any
  // number of locales: siblings are discovered per locale directory.
  const translations: Partial<Record<Locale, string>> | undefined =
    locale === "en" && fs.existsSync(path.join(POSTS_DIR, `${enSlug}.md`))
      ? (() => {
          const map: Partial<Record<Locale, string>> = { en: enSlug }
          let found = false
          for (const loc of locales) {
            if (loc === "en") continue
            const sibling = path.join(POSTS_DIR, localeDirName(loc), `${enSlug}.md`)
            if (fs.existsSync(sibling)) {
              map[loc] = enSlug
              found = true
            }
          }
          return found ? map : undefined
        })()
      : undefined

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: normalizeDate(data.date),
    updated: data.updated ? normalizeDate(data.updated) : undefined,
    tags: tagsRaw.map((t: unknown) => String(t).trim().toLowerCase()).filter(Boolean),
    featured: Boolean(data.featured),
    draft: Boolean(data.draft),
    faq: faqRaw
      .filter((f): f is { q: string; a: string } => Boolean(f) && typeof f === "object" && "q" in f && "a" in f)
      .map((f) => ({ q: String(f.q), a: String(f.a) })),
    content,
    translationOf,
    translations,
    language: typeof data.language === "string" ? data.language : locale === "en" ? undefined : locale,
    interactive: ["ev-charging-europe", "europe-earthquakes-ten-years", "hk-ev-charging"].includes(
      data.interactive as string,
    )
      ? data.interactive
      : undefined,
    canonical: typeof data.canonical === "string" ? data.canonical : undefined,
    readingTime: computeReadingTime(content),
  }
}

function postDir(locale: Locale): string {
  return locale === "en" ? POSTS_DIR : path.join(POSTS_DIR, localeDirName(locale))
}

function readPosts(locale: Locale): Post[] {
  const dir = postDir(locale)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".md") && !f.startsWith("_"))
    .map((f) => parseFile(f, dir, locale))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** All published posts for a locale, newest first. */
export function getAllPosts(options?: { includeDrafts?: boolean; locale?: Locale }): Post[] {
  const locale = options?.locale ?? "en"
  return readPosts(locale).filter((p) => (options?.includeDrafts || !p.draft) && !(locale === "en" && p.translationOf))
}

export function getPostBySlug(slug: string, locale: Locale = "en", includeDrafts = false): Post | undefined {
  return readPosts(locale).find((p) => p.slug === slug && (includeDrafts || !p.draft))
}

/** Unique sorted tag list across all published posts of a locale. */
export function getAllTags(locale: Locale = "en"): string[] {
  const tags = new Set<string>()
  for (const post of getAllPosts({ locale })) {
    for (const tag of post.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b))
}

export function getPostsByTag(tag: string, locale: Locale = "en"): Post[] {
  return getAllPosts({ locale }).filter((p) => p.tags.includes(tag.toLowerCase()))
}

/**
 * Tags that co-occur with `tag` across all posts, most frequent first.
 * Used to give thin tag archives real internal links instead of a bare list.
 */
export function getRelatedTags(tag: string, locale: Locale = "en", limit = 8): string[] {
  const target = tag.toLowerCase()
  const counts = new Map<string, number>()
  for (const post of getAllPosts({ locale })) {
    if (!post.tags.includes(target)) continue
    for (const other of post.tags) {
      if (other === target) continue
      counts.set(other, (counts.get(other) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name]) => name)
}

/** Previous (older) and next (newer) post around `slug`, for post navigation. */
export function getAdjacentPosts(slug: string, locale: Locale = "en"): { prev?: Post; next?: Post } {
  const posts = getAllPosts({ locale })
  const index = posts.findIndex((p) => p.slug === slug)
  if (index === -1) return {}
  return {
    prev: index < posts.length - 1 ? posts[index + 1] : undefined,
    next: index > 0 ? posts[index - 1] : undefined,
  }
}

export function wordCount(markdown: string): number {
  return countWords(markdown)
}

export function formatDate(iso: string, localeTag = "en-US"): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(localeTag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}
