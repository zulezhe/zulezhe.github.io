import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllPosts, getPostBySlug, getAdjacentPosts, formatDate } from "@/lib/posts"
import { renderMarkdown } from "@/lib/markdown"
import { siteConfig, absUrl } from "@/lib/site"
import ChargingEurope from "@/components/ChargingEurope"
import TableOfContents from "@/components/TableOfContents"
import TagList from "@/components/TagList"
import ReadingTools from "@/components/ReadingTools"
import CopyCode from "@/components/CopyCode"
import Giscus from "@/components/Giscus"
import JsonLd from "@/components/JsonLd"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts({ includeDrafts: true, includeTranslations: true }).map((post) => ({ slug: post.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, true)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: post.canonical ?? `/blog/${post.slug}/`,
      ...(post.translations ? { languages: { en: `/blog/${post.translations.en}/`, "zh-CN": `/blog/${post.translations.zh}/`, "x-default": `/blog/${post.translations.en}/` } } : {}),
    },
    openGraph: {
      type: "article",
      url: post.canonical ?? `/blog/${post.slug}/`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [siteConfig.name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const interactive = post.interactive === "ev-charging-europe"
  const [introduction, ...remaining] = interactive
    ? post.content.split("<!-- interactive:ev-charging-europe -->")
    : [post.content]
  const { html, headings: introHeadings } = await renderMarkdown(introduction)
  const { html: afterHtml, headings: afterHeadings } = await renderMarkdown(remaining.join("\n"))
  const headings = [...introHeadings, ...(interactive ? [{ id: "explore-network", text: post.language === "zh-CN" ? "交互地图与报告" : "Interactive map and report", depth: 2 as const }] : []), ...afterHeadings]
  const { prev, next } = getAdjacentPosts(post.slug)
  const postUrl = absUrl(`/blog/${post.slug}/`)

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    keywords: post.tags.join(", "),
    inLanguage: post.language ?? "en",
    wordCount: post.content.split(/\s+/).length,
    url: postUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    author: {
      "@type": "Person",
      name: siteConfig.name,
      url: absUrl("/about/"),
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.name,
      url: absUrl("/"),
    },
    isPartOf: { "@type": "Blog", name: `${siteConfig.name}'s blog`, url: absUrl("/blog/") },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absUrl("/blog/") },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  }

  const faqJsonLd =
    post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}

      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className={`grid grid-cols-1 gap-12 ${interactive ? "" : "lg:grid-cols-[minmax(0,1fr)_220px]"}`}>
          <article lang={post.language} className={`mx-auto w-full min-w-0 ${interactive ? "interactive-post" : "max-w-2xl"}`}>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-500 dark:text-zinc-500">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="transition hover:text-accent">Home</Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/blog" className="transition hover:text-accent">Blog</Link>
                </li>
              </ol>
            </nav>

            <header>
              {post.translations && <nav aria-label="Article language" className="mb-6 flex items-center gap-2 text-sm">
                <Link href={`/blog/${post.translations.en}`} hrefLang="en" lang="en" aria-current={post.language !== "zh-CN" ? "page" : undefined} className={`language-choice ${post.language !== "zh-CN" ? "is-current" : ""}`}>English</Link>
                <Link href={`/blog/${post.translations.zh}`} hrefLang="zh-CN" lang="zh-CN" aria-current={post.language === "zh-CN" ? "page" : undefined} className={`language-choice ${post.language === "zh-CN" ? "is-current" : ""}`}>中文</Link>
              </nav>}
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
                {post.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                {post.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500 dark:text-zinc-500">
                <Link
                  href="/about"
                  className="font-medium text-zinc-700 transition hover:text-accent dark:text-zinc-300"
                >
                  {siteConfig.name}
                </Link>
                <span aria-hidden="true">·</span>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.updated && post.updated !== post.date ? (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                </span>
              </>
            ) : null}
                <span aria-hidden="true">·</span>
                <span>{post.readingTime} min read</span>
              </div>
              <div className="mt-5">
                <TagList tags={post.tags} />
              </div>
            </header>

            <div className="my-8"><ReadingTools /></div>

            {/* Mobile TOC */}
            <div className={interactive ? "mb-10" : "mb-10 lg:hidden"}>
              <TableOfContents headings={headings} />
            </div>

            <div
              className="article-content prose prose-zinc dark:prose-invert
                prose-headings:tracking-tight
                prose-a:font-medium prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-accent/50
                prose-code:before:content-none prose-code:after:content-none
                prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800"
            >
              <div dangerouslySetInnerHTML={{ __html: html }} />
              {interactive && <ChargingEurope basePath={siteConfig.basePath} language={post.language === "zh-CN" ? "zh" : "en"} />}
              {afterHtml && <div dangerouslySetInnerHTML={{ __html: afterHtml }} />}
            </div>

            {/* FAQ (renders structured data too — see FAQPage JSON-LD above) */}
            {post.faq.length > 0 ? (
              <section aria-labelledby="faq-heading" className="mt-12">
                <h2 id="faq-heading" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Frequently asked questions
                </h2>
                <div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
                  {post.faq.map((item) => (
                    <details key={item.q} className="group py-4">
                      <summary className="cursor-pointer list-none font-medium text-zinc-900 marker:content-none hover:text-accent dark:text-zinc-100">
                        <span className="mr-2 inline-block transition group-open:rotate-90" aria-hidden="true">›</span>
                        {item.q}
                      </summary>
                      <p className="mt-3 pl-5 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Prev / next */}
            <nav
              aria-label="Post navigation"
              className="mt-14 grid gap-4 border-t border-zinc-200 pt-8 sm:grid-cols-2 dark:border-zinc-800"
            >
              {prev ? (
                <Link
                  href={`/blog/${prev.slug}`}
                  className="group rounded-xl border border-zinc-200 p-4 transition hover:border-accent/40 dark:border-zinc-800"
                >
                  <span className="text-xs uppercase tracking-wider text-zinc-500">← Older</span>
                  <span className="mt-1 block font-medium text-zinc-900 transition group-hover:text-accent dark:text-zinc-100">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/blog/${next.slug}`}
                  className="group rounded-xl border border-zinc-200 p-4 text-right transition hover:border-accent/40 dark:border-zinc-800"
                >
                  <span className="text-xs uppercase tracking-wider text-zinc-500">Newer →</span>
                  <span className="mt-1 block font-medium text-zinc-900 transition group-hover:text-accent dark:text-zinc-100">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </nav>

            <Giscus />
          </article>

          {/* Desktop TOC */}
          <aside className={interactive ? "hidden" : "hidden lg:block"}>
            <div className="sticky top-24">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        </div>
      </div>

      <CopyCode />
    </>
  )
}
