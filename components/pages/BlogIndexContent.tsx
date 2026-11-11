import { getDictionary, fmt, type Locale } from "@/lib/i18n"
import { getAllPosts, getAllTags } from "@/lib/posts"
import PostExplorer from "@/components/PostExplorer"

export default async function BlogIndexContent({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  const posts = getAllPosts({ locale })
  const tags = getAllTags(locale)

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">{t.blog.title}</h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          {fmt(t.blog.countLine, { count: posts.length })}
        </p>
      </header>

      <PostExplorer
        posts={posts.map(({ slug, title, description, date, tags, readingTime }) => ({ slug, title, description, date, tags, readingTime }))}
        tags={tags}
        locale={locale}
        copy={t.explorer}
      />
    </div>
  )
}
