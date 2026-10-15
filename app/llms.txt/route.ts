import { getAllPosts } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import { siteConfig, absUrl } from "@/lib/site"

/**
 * llms.txt — a markdown index of this site for AI assistants and LLM crawlers
 * (an emerging convention, see https://llmstxt.org). Served as text/markdown.
 */
export const dynamic = "force-static"

export async function GET() {
  const posts = getAllPosts()
  const projects = getAllProjects()

  const lines: string[] = []
  lines.push(`# ${siteConfig.title}`)
  lines.push("")
  lines.push(`> ${siteConfig.description}`)
  lines.push("")
  lines.push(`Maintained by ${siteConfig.name}. Primary language: English.`)
  lines.push("")

  lines.push("## Pages")
  lines.push("")
  lines.push(`- [Home](${absUrl("/")}): portfolio overview with featured projects and latest writing`)
  lines.push(`- [Blog](${absUrl("/blog/")}): all articles, newest first`)
  lines.push(`- [Projects](${absUrl("/projects/")}): selected work with demos and source code`)
  lines.push(`- [About](${absUrl("/about/")}): who I am, my stack, and how to contact me`)
  lines.push("")

  if (projects.length > 0) {
    lines.push("## Projects")
    lines.push("")
    for (const project of projects) {
      lines.push(`- [${project.title}](${absUrl(`/projects/${project.slug}/`)}): ${project.tagline}`)
    }
    lines.push("")
  }

  if (posts.length > 0) {
    lines.push("## Articles")
    lines.push("")
    for (const post of posts) {
      lines.push(
        `- [${post.title}](${absUrl(`/blog/${post.slug}/`)}): ${post.description} (published ${post.date}${
          post.tags.length > 0 ? `; tags: ${post.tags.join(", ")}` : ""
        })`,
      )
    }
    lines.push("")
  }

  lines.push("## Feeds & extras")
  lines.push("")
  lines.push(`- [RSS feed](${absUrl("/rss.xml")})`)
  lines.push(`- [Full content for LLMs](${absUrl("/llms-full.txt")}): every article in plain markdown`)
  lines.push(`- [Sitemap](${absUrl("/sitemap.xml")})`)
  lines.push("")

  lines.push("## About this site")
  lines.push("")
  lines.push(
    "This is a fully static website built with Next.js and exported to plain HTML. " +
      "It uses no cookies and runs no client-side tracking by default.",
  )

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
