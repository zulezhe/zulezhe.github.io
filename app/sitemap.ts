import type { MetadataRoute } from "next"
import { absUrl } from "@/lib/site"
import { languageAlternates, localizedPath } from "@/lib/i18n"
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
  const enPosts = getAllPosts({ locale: "en" })
  const zhPosts = getAllPosts({ locale: "zh-TW" })
  const posts = enPosts
  const projects = getAllProjects()
  const tags = getAllTags()
  const zhTags = getAllTags("zh-TW")

  const postsLatest = latestDate(posts.flatMap((p) => [p.date, p.updated]))
  const projectsLatest = latestDate(projects.map((p) => p.date))

  return [
    {
      url: absUrl("/"),
      lastModified: postsLatest,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: languageAlternates("/") },
    },
    {
      url: absUrl("/blog/"),
      lastModified: postsLatest,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: languageAlternates("/blog/") },
    },
    {
      url: absUrl("/projects/"),
      lastModified: projectsLatest,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: languageAlternates("/projects/") },
    },
    {
      url: absUrl("/about/"),
      changeFrequency: "yearly",
      priority: 0.7,
      alternates: { languages: languageAlternates("/about/") },
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
                "zh-TW": absUrl(`/zh-TW/blog/${post.translations["zh-TW"]}/`),
                "x-default": absUrl(`/blog/${post.translations.en}/`),
              },
            },
          }
        : { alternates: { languages: languageAlternates(`/blog/${post.slug}/`) } }),
    })),
    ...projects.map((project) => ({
      url: absUrl(`/projects/${project.slug}/`),
      lastModified: project.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: languageAlternates(`/projects/${project.slug}/`) },
    })),
    ...tags.map((tag) => {
      const path = `/blog/tag/${encodeURIComponent(tag)}/`
      return {
        url: absUrl(path),
        changeFrequency: "weekly" as const,
        priority: 0.5,
        alternates: { languages: languageAlternates(path) },
      }
    }),
    // zh-TW pages
    {
      url: absUrl(localizedPath("zh-TW", "/")),
      lastModified: postsLatest,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absUrl(localizedPath("zh-TW", "/blog/")),
      lastModified: postsLatest,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absUrl(localizedPath("zh-TW", "/projects/")),
      lastModified: projectsLatest,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absUrl(localizedPath("zh-TW", "/about/")),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    ...zhPosts.map((post) => ({
      url: absUrl(localizedPath("zh-TW", `/blog/${post.slug}/`)),
      lastModified: post.updated ?? post.date,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...(post.translations
        ? {
            alternates: {
              languages: {
                en: absUrl(`/blog/${post.translations.en}/`),
                "zh-TW": absUrl(`/zh-TW/blog/${post.translations["zh-TW"]}/`),
                "x-default": absUrl(`/blog/${post.translations.en}/`),
              },
            },
          }
        : { alternates: { languages: languageAlternates(`/blog/${post.slug}/`) } }),
    })),
    ...projects.map((project) => ({
      url: absUrl(localizedPath("zh-TW", `/projects/${project.slug}/`)),
      lastModified: project.date,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...zhTags.map((tag) => ({
      url: absUrl(localizedPath("zh-TW", `/blog/tag/${encodeURIComponent(tag)}/`)),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ]
}
