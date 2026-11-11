import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllPosts, getPostBySlug } from "@/lib/posts"
import { absUrl, pageMetadata } from "@/lib/site"
import { languageAlternates, localizedPath } from "@/lib/i18n"
import BlogPostContent from "@/components/pages/BlogPostContent"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts({ locale: "zh-TW" }).map((post) => ({ slug: post.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, "zh-TW")
  if (!post) notFound()

  const path = localizedPath("zh-TW", `/blog/${post.slug}/`)

  return pageMetadata({
    title: post.title,
    description: post.description,
    path,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date,
    tags: post.tags,
    ogImage: {
      url: absUrl(`/blog/${post.slug}/opengraph-image`),
      alt: post.title,
    },
    languages: languageAlternates(`/blog/${post.slug}/`),
  })
}

export default async function ZhtwBlogPostPage({ params }: Props) {
  const { slug } = await params
  return <BlogPostContent locale="zh-TW" slug={slug} />
}
