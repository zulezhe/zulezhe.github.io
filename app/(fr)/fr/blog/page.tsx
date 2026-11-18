import type { Metadata } from "next"
import { pageMetadata } from "@/lib/site"
import { getDictionary, languageAlternates, localizedPath } from "@/lib/i18n"
import BlogIndexContent from "@/components/pages/BlogIndexContent"

const t = getDictionary("fr")
const path = localizedPath("fr", "/blog/")

export const metadata: Metadata = pageMetadata({
  title: t.blog.title,
  description: t.blog.metaDescription,
  path,
  languages: languageAlternates("/blog/"),
})

export default function ZhtwBlogIndexPage() {
  return <BlogIndexContent locale="fr" />
}
