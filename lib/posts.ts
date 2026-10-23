import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const POSTS_DIR = path.join(process.cwd(), "content", "blog")

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
  translationOf?: string
  translations?: { en: string; zh: string }
  language?: string
  interactive?: "ev-charging-europe"
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

function parseFile(fileName: string): Post {
  const slug = fileName.replace(/\.md$/i, "")
  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), "utf8")
  const { data, content } = matter(raw)

  const tagsRaw = Array.isArray(data.tags) ? data.tags : []
  const faqRaw = Array.isArray(data.faq) ? data.faq : []

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
    translationOf: typeof data.translationOf === "string" ? data.translationOf : undefined,
    translations: data.translations?.en && data.translations?.zh ? { en: String(data.translations.en), zh: String(data.translations.zh) } : undefined,
    language: typeof data.language === "string" ? data.language : undefined,
    interactive: data.interactive === "ev-charging-europe" ? data.interactive : undefined,
    canonical: typeof data.canonical === "string" ? data.canonical : undefined,
    readingTime: computeReadingTime(content),
  }
}

/** All published posts, newest first. */
export function getAllPosts(options?: { includeDrafts?: boolean; includeTranslations?: boolean }): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md") && !f.startsWith("_"))
  return files
    .map(parseFile)
    .filter((p) => (options?.includeDrafts || !p.draft) && (options?.includeTranslations || !p.translationOf))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function getPostBySlug(slug: string, includeDrafts = false): Post | undefined {
  return getAllPosts({ includeDrafts, includeTranslations: true }).find((p) => p.slug === slug)
}

/** Unique sorted tag list across all published posts. */
export function getAllTags(): string[] {
  const tags = new Set<string>()
  for (const post of getAllPosts()) {
    for (const tag of post.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b))
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag.toLowerCase()))
}

/** Previous (older) and next (newer) post around `slug`, for post navigation. */
export function getAdjacentPosts(slug: string): { prev?: Post; next?: Post } {
  const posts = getAllPosts()
  const canonical = getPostBySlug(slug)?.translationOf ?? slug
  const index = posts.findIndex((p) => p.slug === canonical)
  if (index === -1) return {}
  return {
    prev: index < posts.length - 1 ? posts[index + 1] : undefined,
    next: index > 0 ? posts[index - 1] : undefined,
  }
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}
