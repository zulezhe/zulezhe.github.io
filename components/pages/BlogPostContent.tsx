import Link from "next/link"
import { notFound } from "next/navigation"
import { getPostBySlug, getAdjacentPosts, wordCount } from "@/lib/posts"
import { renderMarkdown } from "@/lib/markdown"
import { siteConfig, absUrl } from "@/lib/site"
import { getDictionary, fmt, formatDate, localizedPath, type Locale } from "@/lib/i18n"
import ChargingEurope from "@/components/ChargingEurope"
import EarthquakePulse from "@/components/EarthquakePulse"
import TableOfContents from "@/components/TableOfContents"
import TagList from "@/components/TagList"
import ReadingTools from "@/components/ReadingTools"
import CopyCode from "@/components/CopyCode"
import Giscus from "@/components/Giscus"
import JsonLd from "@/components/JsonLd"

export default async function BlogPostContent({ locale, slug }: { locale: Locale; slug: string }) {
  const post = getPostBySlug(slug, locale)
  if (!post) notFound()
  const t = getDictionary(locale)

  const interactiveSlug = post.interactive
  const interactive = Boolean(interactiveSlug)
  const interactiveMarker = interactiveSlug ? `<!-- interactive:${interactiveSlug} -->` : null
  const [introduction, ...remaining] = interactiveMarker
    ? post.content.split(interactiveMarker)
    : [post.content]
  const { html, headings: introHeadings } = await renderMarkdown(introduction)
  const { html: afterHtml, headings: afterHeadings } = await renderMarkdown(remaining.join("\n"))
  const interactiveHeading =
    interactiveSlug === "europe-earthquakes-ten-years"
      ? { id: "explore-earthquakes", text: t.post.interactiveEarthquakeHeading }
      : interactiveSlug === "ev-charging-europe"
        ? { id: "explore-network", text: t.post.interactiveChargingHeading }
        : null
  const headings = [...introHeadings, ...(interactiveHeading ? [{ ...interactiveHeading, depth: 2 as const }] : []), ...afterHeadings]
  const { prev, next } = getAdjacentPosts(slug, locale)
  const postUrl = absUrl(localizedPath(locale, `/blog/${post.slug}/`))

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    keywords: post.tags.join(", "),
    articleSection: post.tags[0],
    inLanguage: locale,
    wordCount: wordCount(post.content),
    url: postUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    image: [absUrl(`/blog/${post.slug}/opengraph-image`)],
    author: {
      "@type": "Person",
      "@id": `${absUrl("/")}#person`,
      name: siteConfig.name,
      url: absUrl(localizedPath(locale, "/about/")),
    },
    publisher: {
      "@type": "Person",
      "@id": absUrl("/#person"),
      name: siteConfig.name,
      url: absUrl("/"),
    },
    isPartOf: { "@type": "Blog", name: `${siteConfig.name}'s blog`, url: absUrl(localizedPath(locale, "/blog/")) },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.post.home, item: absUrl(localizedPath(locale, "/")) },
      { "@type": "ListItem", position: 2, name: t.post.blog, item: absUrl(localizedPath(locale, "/blog/")) },
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
            <nav aria-label={t.post.breadcrumbAria} className="mb-8 text-sm text-zinc-500 dark:text-zinc-500">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href={localizedPath(locale, "/")} className="transition hover:text-accent">{t.post.home}</Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={localizedPath(locale, "/blog")} className="transition hover:text-accent">{t.post.blog}</Link>
                </li>
              </ol>
            </nav>

            <header>
              {post.translations && <nav aria-label={t.post.languageAria} className="mb-6 flex items-center gap-2 text-sm">
                <Link href={localizedPath("en", `/blog/${post.translations.en}`)} hrefLang="en" lang="en" aria-current={locale !== "zh-TW" ? "page" : undefined} className={`language-choice ${locale !== "zh-TW" ? "is-current" : ""}`}>English</Link>
                <Link href={localizedPath("zh-TW", `/blog/${post.translations["zh-TW"]}`)} hrefLang="zh-TW" lang="zh-TW" aria-current={locale === "zh-TW" ? "page" : undefined} className={`language-choice ${locale === "zh-TW" ? "is-current" : ""}`}>繁體中文</Link>
              </nav>}
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
                {post.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                {post.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500 dark:text-zinc-500">
                <Link
                  href={localizedPath(locale, "/about")}
                  className="font-medium text-zinc-700 transition hover:text-accent dark:text-zinc-300"
                >
                  {siteConfig.name}
                </Link>
                <span aria-hidden="true">·</span>
                <time dateTime={post.date}>{formatDate(locale, post.date)}</time>
                {post.updated && post.updated !== post.date ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t.post.updated} <time dateTime={post.updated}>{formatDate(locale, post.updated)}</time>
                    </span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{fmt(t.post.minRead, { count: post.readingTime })}</span>
              </div>
              <div className="mt-5">
                <TagList tags={post.tags} ariaLabel={t.tags.aria} locale={locale} />
              </div>
            </header>

            <div className="my-8"><ReadingTools copy={t.readingTools} /></div>

            {/* Mobile TOC */}
            <div className={interactive ? "mb-10" : "mb-10 lg:hidden"}>
              <TableOfContents headings={headings} copy={t.toc} />
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
              {interactiveSlug === "ev-charging-europe" ? (
                <ChargingEurope basePath={siteConfig.basePath} language={locale} />
              ) : null}
              {interactiveSlug === "europe-earthquakes-ten-years" ? (
                <EarthquakePulse basePath={siteConfig.basePath} locale={locale} />
              ) : null}
              {afterHtml && <div dangerouslySetInnerHTML={{ __html: afterHtml }} />}
            </div>

            {/* FAQ (renders structured data too — see FAQPage JSON-LD above) */}
            {post.faq.length > 0 ? (
              <section aria-labelledby="faq-heading" className="mt-12">
                <h2 id="faq-heading" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t.post.faqHeading}
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
              aria-label={t.post.postNavAria}
              className="mt-14 grid gap-4 border-t border-zinc-200 pt-8 sm:grid-cols-2 dark:border-zinc-800"
            >
              {prev ? (
                <Link
                  href={localizedPath(locale, `/blog/${prev.slug}`)}
                  className="group rounded-xl border border-zinc-200 p-4 transition hover:border-accent/40 dark:border-zinc-800"
                >
                  <span className="text-xs uppercase tracking-wider text-zinc-500">{t.post.older}</span>
                  <span className="mt-1 block font-medium text-zinc-900 transition group-hover:text-accent dark:text-zinc-100">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={localizedPath(locale, `/blog/${next.slug}`)}
                  className="group rounded-xl border border-zinc-200 p-4 text-right transition hover:border-accent/40 dark:border-zinc-800"
                >
                  <span className="text-xs uppercase tracking-wider text-zinc-500">{t.post.newer}</span>
                  <span className="mt-1 block font-medium text-zinc-900 transition group-hover:text-accent dark:text-zinc-100">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </nav>

            <Giscus locale={locale} />
          </article>

          {/* Desktop TOC */}
          <aside className={interactive ? "hidden" : "hidden lg:block"}>
            <div className="sticky top-24">
              <TableOfContents headings={headings} copy={t.toc} />
            </div>
          </aside>
        </div>
      </div>

      <CopyCode copy={t.copyCode} />
    </>
  )
}
