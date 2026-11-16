import Link from "next/link"
import { absUrl, siteConfig } from "@/lib/site"
import { getDictionary, fmt, localizedPath, type Locale } from "@/lib/i18n"
import { getPostsByTag, getRelatedTags } from "@/lib/posts"
import PostCard from "@/components/PostCard"
import JsonLd from "@/components/JsonLd"

export default async function TagArchiveContent({ locale, tag }: { locale: Locale; tag: string }) {
  const t = getDictionary(locale)
  const posts = getPostsByTag(tag, locale)
  if (posts.length === 0) return null
  const related = getRelatedTags(tag, locale)
  const path = localizedPath(locale, `/blog/tag/${encodeURIComponent(tag)}/`)

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `#${tag}`,
          description: fmt(t.blog.tagCountLine, { count: posts.length, tag }),
          url: absUrl(path),
          isPartOf: { "@type": "WebSite", name: siteConfig.name, url: absUrl("/") },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: posts.length,
            itemListElement: posts.map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absUrl(localizedPath(locale, `/blog/${post.slug}/`)),
              name: post.title,
            })),
          },
        }}
      />

      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <header className="mb-10">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
            <Link href={localizedPath(locale, "/blog")} className="transition hover:text-accent">{t.blog.allPosts}</Link>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            <span className="text-accent">#</span>
            {tag}
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {fmt(t.blog.tagCountLine, { count: posts.length, tag })}
          </p>
          {/* Intro copy keeps thin (single-post) archives from looking like an
              empty index — the tag page needs real prose to be worth indexing. */}
          <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
            {posts.length === 1
              ? fmt(t.blog.tagSingleIntro, { count: posts.length, tag })
              : fmt(t.blog.tagIntro, { count: posts.length, tag })}
          </p>
        </header>

        <div>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} locale={locale} copy={t.post} tagsAria={t.tags.aria} />
          ))}
        </div>

        {related.length > 0 ? (
          <nav aria-label={t.blog.tagRelatedHeading} className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t.blog.tagRelatedHeading}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {related.map((other) => (
                <li key={other}>
                  <Link
                    href={localizedPath(locale, `/blog/tag/${encodeURIComponent(other)}/`)}
                    className="inline-block rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
                  >
                    #{other}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </>
  )
}
