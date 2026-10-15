import type { MetadataRoute } from "next"
import { siteConfig, absUrl } from "@/lib/site"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const projects = getAllProjects()
  const tags = getAllTags()

  return [
    {
      url: absUrl("/"),
      lastModified: posts[0]?.date ?? new Date().toISOString().slice(0, 10),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absUrl("/blog/"),
      lastModified: posts[0]?.date ?? new Date().toISOString().slice(0, 10),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absUrl("/projects/"),
      lastModified: projects[0]?.date ?? new Date().toISOString().slice(0, 10),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absUrl("/about/"),
      changeFrequency: "yearly",
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: absUrl(`/blog/${post.slug}/`),
      lastModified: post.updated ?? post.date,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...projects.map((project) => ({
      url: absUrl(`/projects/${project.slug}/`),
      lastModified: project.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...tags.map((tag) => ({
      url: absUrl(`/blog/tag/${tag}/`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ]
}
