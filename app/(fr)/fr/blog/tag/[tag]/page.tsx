import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllTags, getPostsByTag } from "@/lib/posts"
import { tagPageMetadata, tagPagePath } from "@/lib/tag-pages"
import TagArchiveContent from "@/components/pages/TagArchiveContent"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllTags("fr").map((tag) => ({ tag: encodeURIComponent(tag) }))
}

type Props = { params: Promise<{ tag: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return tagPageMetadata({ locale: "fr", tag: decoded, path: tagPagePath("fr", decoded) })
}

export default async function ZhtwTagPage({ params }: Props) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = getPostsByTag(decoded, "fr")
  if (posts.length === 0) notFound()

  return <TagArchiveContent locale="fr" tag={decoded} />
}
