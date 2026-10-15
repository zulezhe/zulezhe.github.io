import { getAllPosts } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import { siteConfig, absUrl } from "@/lib/site"

/**
 * llms-full.txt — the full markdown content of every post and project,
 * so AI answer engines can ingest the site in a single request.
 */
export const dynamic = "force-static"

export async function GET() {
  const parts: string[] = []
  const divider = "\n\n---\n\n"

  parts.push(
    `# ${siteConfig.title} — full content\n\n> ${siteConfig.description}\n\n` +
      `Site: ${absUrl("/")}\nLanguage: English\nAuthor: ${siteConfig.name}\n`,
  )

  for (const post of getAllPosts()) {
    parts.push(
      `# ${post.title}\n\n` +
        `URL: ${absUrl(`/blog/${post.slug}/`)}\n` +
        `Published: ${post.date}${post.updated ? ` (updated ${post.updated})` : ""}\n` +
        `Author: ${siteConfig.name}\n` +
        (post.tags.length > 0 ? `Tags: ${post.tags.join(", ")}\n` : "") +
        `\n${post.content.trim()}\n`,
    )
  }

  for (const project of getAllProjects()) {
    parts.push(
      `# Project: ${project.title}\n\n` +
        `URL: ${absUrl(`/projects/${project.slug}/`)}\n` +
        `Tagline: ${project.tagline}\n` +
        (project.tech.length > 0 ? `Tech: ${project.tech.join(", ")}\n` : "") +
        (project.links.repo ? `Source: ${project.links.repo}\n` : "") +
        (project.links.demo ? `Demo: ${project.links.demo}\n` : "") +
        `\n${project.content.trim()}\n`,
    )
  }

  return new Response(parts.join(divider), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
