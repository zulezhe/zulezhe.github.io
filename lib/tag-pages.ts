import type { Metadata } from "next"
import { pageMetadata } from "@/lib/site"
import { fmt, getDictionary, languageAlternates, localizedPath, type Locale } from "@/lib/i18n"
import { getPostsByTag } from "@/lib/posts"

/**
 * Metadata for a tag archive page.
 *
 * Every tag page used to ship the same near-empty description
 * ("1 article tagged with …"), which made 40+ of them thin duplicates of
 * each other and of the blog index. The description now names the tag, the
 * post titles it holds and the topics those posts share, so each archive
 * stands on its own.
 */
export function tagPageMetadata({
  locale,
  tag,
  path,
}: {
  locale: Locale
  tag: string
  path: string
}): Metadata {
  const posts = getPostsByTag(tag, locale)
  if (posts.length === 0) return {}

  const t = getDictionary(locale)
  const titles = posts.map((p) => p.title).join(", ")
  const description =
    posts.length === 1
      ? fmt(t.blog.tagMetaSingle, { tag, title: posts[0].title })
      : fmt(t.blog.tagMeta, { count: posts.length, tag, titles })

  return pageMetadata({
    title: `#${tag}`,
    description,
    path,
    languages: languageAlternates(path),
  })
}

/** Canonical path of a tag archive for a locale. */
export function tagPagePath(locale: Locale, tag: string): string {
  const enPath = `/blog/tag/${encodeURIComponent(tag)}/`
  return locale === "en" ? enPath : localizedPath("zh-TW", enPath)
}
