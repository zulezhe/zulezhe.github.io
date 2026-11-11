import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllTags, getPostsByTag } from "@/lib/posts"
import { pageMetadata } from "@/lib/site"
import { getDictionary, fmt, languageAlternates, localizedPath } from "@/lib/i18n"
import TagArchiveContent from "@/components/pages/TagArchiveContent"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllTags("zh-TW").map((tag) => ({ tag: encodeURIComponent(tag) }))
}

type Props = { params: Promise<{ tag: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = getPostsByTag(decoded, "zh-TW")
  if (posts.length === 0) return {}
  const t = getDictionary("zh-TW")

  const enPath = `/blog/tag/${encodeURIComponent(decoded)}/`
  return pageMetadata({
    title: `#${decoded}`,
    description: fmt(t.blog.tagCountLine, { count: posts.length, tag: decoded }),
    path: localizedPath("zh-TW", enPath),
    languages: languageAlternates(enPath),
  })
}

export default async function ZhtwTagPage({ params }: Props) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = getPostsByTag(decoded, "zh-TW")
  if (posts.length === 0) notFound()

  return <TagArchiveContent locale="zh-TW" tag={decoded} />
}
