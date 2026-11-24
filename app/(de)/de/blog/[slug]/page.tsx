import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllPosts, getPostBySlug } from "@/lib/posts"
import { absUrl, pageMetadata } from "@/lib/site"
import { languageAlternates, localizedPath } from "@/lib/i18n"
import BlogPostContent from "@/components/pages/BlogPostContent"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts({ locale: "de" }).map((post) => ({ slug: post.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, "de")
  if (!post) notFound()

  const path = post.canonical ?? localizedPath("de", `/blog/${post.slug}/`)
  const isMirror = /^https?:\/\//i.test(path)

  return pageMetadata({
    title: post.title,
    description: post.description,
    path,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date,
    tags: post.tags,
    ogImage: {
      url: absUrl(`/og/blog/${post.slug}.png`),
      alt: post.title,
    },
    ...(isMirror ? {} : { languages: languageAlternates(`/blog/${post.slug}/`) }),
  })
}

export default async function ZhtwBlogPostPage({ params }: Props) {
  const { slug } = await params
  return <BlogPostContent locale="de" slug={slug} />
}
