import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllPosts, getPostBySlug } from "@/lib/posts"
import { absUrl, pageMetadata } from "@/lib/site"
import { languageAlternates } from "@/lib/i18n"
import BlogPostContent from "@/components/pages/BlogPostContent"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts({ includeDrafts: true }).map((post) => ({ slug: post.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, "en", true)
  if (!post) notFound()

  const path = post.canonical ?? `/blog/${post.slug}/`

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
    ...(post.translations
      ? {
          languages: {
            en: absUrl(`/blog/${post.translations.en}/`),
            "zh-TW": absUrl(`/zh-TW/blog/${post.translations["zh-TW"]}/`),
            "x-default": absUrl(`/blog/${post.translations.en}/`),
          },
        }
      : { languages: languageAlternates(path) }),
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  return <BlogPostContent locale="en" slug={slug} />
}
