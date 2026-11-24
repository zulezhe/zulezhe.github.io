import type { MetadataRoute } from "next"
import { absUrl } from "@/lib/site"
import { languageAlternates, localizedPath } from "@/lib/i18n"
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import { isTagIndexable } from "@/lib/tag-pages"

export const dynamic = "force-static"

/** Latest meaningful modification across a set of dated entries. */
function latestDate(dates: (string | undefined)[]): string | undefined {
  const valid = dates.filter((d): d is string => Boolean(d))
  if (valid.length === 0) return undefined
  return valid.reduce((max, d) => (d > max ? d : max))
}

/** hreflang map for a translated post across every locale. */
function translationAlternates(translations: Record<string, string>): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of locales) {
    if (locale === "en") languages.en = absUrl(`/blog/${translations.en}/`)
    else languages[locale] = absUrl(localizedPath(locale, `/blog/${translations[locale] ?? translations.en}/`))
  }
  languages["x-default"] = absUrl(`/blog/${translations.en}/`)
  return languages
}

/** Sitemap entries for one page path, one per non-default locale. */
function localizedEntries(
  path: string,
  locale: Locale,
  meta: { lastModified?: string; changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number },
): MetadataRoute.Sitemap {
  const posts = getAllPosts({ locale })
  const tags = getAllTags(locale).filter((tag) => isTagIndexable(tag, locale))
  const postsLatest = latestDate(posts.flatMap((p) => [p.date, p.updated]))
  const projectsLatest = latestDate(getAllProjects().map((p) => p.date))

  const base: MetadataRoute.Sitemap = [
    {
      url: absUrl(localizedPath(locale, "/")),
      lastModified: meta.lastModified ?? postsLatest,
      changeFrequency: "weekly",
      priority: meta.priority,
    },
    {
      url: absUrl(localizedPath(locale, "/blog/")),
      lastModified: postsLatest,
      changeFrequency: "weekly",
      priority: meta.priority - 0.1,
    },
    {
      url: absUrl(localizedPath(locale, "/projects/")),
      lastModified: projectsLatest,
      changeFrequency: "monthly",
      priority: meta.priority - 0.1,
    },
    {
      url: absUrl(localizedPath(locale, "/about/")),
      changeFrequency: "yearly",
      priority: meta.priority - 0.3,
    },
  ]
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absUrl(localizedPath(locale, `/blog/${post.slug}/`)),
    lastModified: post.updated ?? post.date,
    changeFrequency: "monthly" as const,
    priority: meta.priority - 0.2,
    ...(post.translations
      ? { alternates: { languages: translationAlternates(post.translations) } }
      : { alternates: { languages: languageAlternates(`/blog/${post.slug}/`) } }),
  }))
  const projectEntries: MetadataRoute.Sitemap = getAllProjects().map((project) => ({
    url: absUrl(localizedPath(locale, `/projects/${project.slug}/`)),
    lastModified: project.date,
    changeFrequency: "monthly" as const,
    priority: meta.priority - 0.2,
  }))
  const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: absUrl(localizedPath(locale, `/blog/tag/${encodeURIComponent(tag)}/`)),
    changeFrequency: "weekly" as const,
    priority: meta.priority - 0.4,
  }))
  return [...base, ...postEntries, ...projectEntries, ...tagEntries]
}

export default function sitemap(): MetadataRoute.Sitemap {
  const enPosts = getAllPosts({ locale: "en" })
  const projects = getAllProjects()
  const tags = getAllTags().filter((tag) => isTagIndexable(tag))

  const postsLatest = latestDate(enPosts.flatMap((p) => [p.date, p.updated]))
  const projectsLatest = latestDate(projects.map((p) => p.date))

  // English (default, prefix-less) entries
  const englishEntries: MetadataRoute.Sitemap = [
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
    ...enPosts.map((post) => ({
      url: absUrl(`/blog/${post.slug}/`),
      lastModified: post.updated ?? post.date,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      ...(post.translations
        ? { alternates: { languages: translationAlternates(post.translations) } }
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
  ]

  // Every non-default locale, generated from one loop. Adding a locale to
  // `locales` in lib/i18n/config.ts adds its sitemap entries automatically.
  const localized: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    if (locale === defaultLocale) continue
    localized.push(...localizedEntries("", locale, { priority: 0.9 }))
  }

  // Interactive artifacts shipped as static HTML under /public (not routes).
  // The map explorer is a real, linked landing page; the analysis report is
  // deliberately noindex'd and stays out of the sitemap.
  const interactive: MetadataRoute.Sitemap = [
    {
      url: absUrl("/interactive/ev-charging-europe/en/"),
      lastModified: postsLatest,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ]

  return [...englishEntries, ...localized, ...interactive]
}
