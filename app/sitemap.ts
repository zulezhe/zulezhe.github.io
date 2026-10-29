import type { MetadataRoute } from "next"
import { absUrl } from "@/lib/site"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"

export const dynamic = "force-static"

/** Latest meaningful modification across a set of dated entries. */
function latestDate(dates: (string | undefined)[]): string | undefined {
  const valid = dates.filter((d): d is string => Boolean(d))
  if (valid.length === 0) return undefined
  return valid.reduce((max, d) => (d > max ? d : max))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts({ includeTranslations: true })
  const projects = getAllProjects()
  const tags = getAllTags()

  const postsLatest = latestDate(posts.flatMap((p) => [p.date, p.updated]))
  const projectsLatest = latestDate(projects.map((p) => p.date))

  return [
    {
      url: absUrl("/"),
      lastModified: postsLatest,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absUrl("/blog/"),
      lastModified: postsLatest,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absUrl("/projects/"),
      lastModified: projectsLatest,
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
      ...(post.translations
        ? {
            alternates: {
              languages: {
                en: absUrl(`/blog/${post.translations.en}/`),
                "zh-CN": absUrl(`/blog/${post.translations.zh}/`),
                "x-default": absUrl(`/blog/${post.translations.en}/`),
              },
            },
          }
        : {}),
    })),
    ...projects.map((project) => ({
      url: absUrl(`/projects/${project.slug}/`),
      lastModified: project.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...tags.map((tag) => ({
      url: absUrl(`/blog/tag/${encodeURIComponent(tag)}/`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ]
}
