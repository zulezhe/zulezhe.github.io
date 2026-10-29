import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getAllTags, getPostsByTag } from "@/lib/posts"
import { pageMetadata } from "@/lib/site"
import PostCard from "@/components/PostCard"

export const dynamicParams = false

const SITE_DESCRIPTION_TAIL =
  "practical notes on web development, SEO and shipping side projects."

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag: encodeURIComponent(tag) }))
}

type Props = { params: Promise<{ tag: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = getPostsByTag(decoded)
  if (posts.length === 0) return {}

  return pageMetadata({
    title: `#${decoded}`,
    description: `All ${posts.length} ${posts.length === 1 ? "article" : "articles"} tagged “${decoded}” — ${SITE_DESCRIPTION_TAIL}`,
    path: `/blog/tag/${encodeURIComponent(decoded)}/`,
  })
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = getPostsByTag(decoded)
  if (posts.length === 0) notFound()

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header className="mb-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
          <Link href="/blog" className="transition hover:text-accent">← All posts</Link>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          <span className="text-accent">#</span>
          {decoded}
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {posts.length} {posts.length === 1 ? "article" : "articles"} tagged with “{decoded}”.
        </p>
      </header>

      <div>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
