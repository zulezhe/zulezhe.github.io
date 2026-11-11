import type { Metadata } from "next"
import { pageMetadata } from "@/lib/site"
import { getDictionary, languageAlternates } from "@/lib/i18n"
import BlogIndexContent from "@/components/pages/BlogIndexContent"

const t = getDictionary("en")

export const metadata: Metadata = pageMetadata({
  title: t.blog.title,
  description: t.blog.metaDescription,
  path: "/blog/",
  languages: languageAlternates("/blog/"),
})

export default function BlogIndexPage() {
  return <BlogIndexContent locale="en" />
}
