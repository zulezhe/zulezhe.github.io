import Link from "next/link"
import { getDictionary, fmt, localizedPath, type Locale } from "@/lib/i18n"
import { getPostsByTag } from "@/lib/posts"
import PostCard from "@/components/PostCard"

export default async function TagArchiveContent({ locale, tag }: { locale: Locale; tag: string }) {
  const t = getDictionary(locale)
  const posts = getPostsByTag(tag, locale)
  if (posts.length === 0) return null

  return (
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
      </header>

      <div>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} locale={locale} copy={t.post} tagsAria={t.tags.aria} />
        ))}
      </div>
    </div>
  )
}
