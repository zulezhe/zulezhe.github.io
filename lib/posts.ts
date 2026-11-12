import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import type { Locale } from "@/lib/i18n/config"

const POSTS_DIR = path.join(process.cwd(), "content", "blog")
/** Sub-directory per non-English locale, e.g. content/blog/zh-TW/ */
const LOCALE_DIRS: Record<Exclude<Locale, "en">, string> = {
  "zh-TW": "zh-TW",
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
  /** Slugs of the sibling translations, derived from the files on disk. */
  translations?: { en: string; "zh-TW": string }
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
  const translations =
    fs.existsSync(path.join(POSTS_DIR, `${enSlug}.md`)) &&
    fs.existsSync(path.join(POSTS_DIR, "zh-TW", `${slug}.md`))
      ? { en: enSlug, "zh-TW": slug }
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
  return locale === "en" ? POSTS_DIR : path.join(POSTS_DIR, LOCALE_DIRS[locale])
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
