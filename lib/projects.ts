import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects")

export interface ProjectLink {
  repo?: string
  demo?: string
}

export interface Project {
  slug: string
  title: string
  tagline: string
  description: string
  /** ISO date string "YYYY-MM-DD" */
  date: string
  tech: string[]
  links: ProjectLink
  featured: boolean
  /** Lower renders first on the home page. */
  order: number
  draft: boolean
  /** Raw markdown source (the detail page body) */
  content: string
}

function parseFile(fileName: string): Project {
  const slug = fileName.replace(/\.md$/i, "")
  const raw = fs.readFileSync(path.join(PROJECTS_DIR, fileName), "utf8")
  const { data, content } = matter(raw)

  const linksRaw = (data.links ?? {}) as Record<string, unknown>

  return {
    slug,
    title: String(data.title ?? slug),
    tagline: String(data.tagline ?? data.description ?? ""),
    description: String(data.description ?? data.tagline ?? ""),
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? "").slice(0, 10),
    tech: (Array.isArray(data.tech) ? data.tech : []).map((t: unknown) => String(t)).filter(Boolean),
    links: {
      repo: linksRaw.repo ? String(linksRaw.repo) : undefined,
      demo: linksRaw.demo ? String(linksRaw.demo) : undefined,
    },
    featured: Boolean(data.featured),
    order: Number.isFinite(data.order) ? Number(data.order) : 99,
    draft: Boolean(data.draft),
    content,
  }
}

/** All published projects, ordered by `order` then newest first. */
export function getAllProjects(options?: { includeDrafts?: boolean }): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) return []
  const files = fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md") && !f.startsWith("_"))
  return files
    .map(parseFile)
    .filter((p) => options?.includeDrafts || !p.draft)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      return a.date < b.date ? 1 : -1
    })
}

export function getProjectBySlug(slug: string, includeDrafts = false): Project | undefined {
  return getAllProjects({ includeDrafts }).find((p) => p.slug === slug)
}
