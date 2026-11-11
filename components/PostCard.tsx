import Link from "next/link"
import type { Post } from "@/lib/posts"
import { localizedPath, type Locale } from "@/lib/i18n/config"
import { fmt, formatDate } from "@/lib/i18n"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import TagList from "./TagList"

export default function PostCard({
  post,
  locale = "en",
  copy,
  tagsAria,
}: {
  post: Post
  locale?: Locale
  copy?: Dictionary["post"]
  tagsAria?: string
}) {
  const minRead = copy ? fmt(copy.minRead, { count: post.readingTime }) : `${post.readingTime} min read`
  return (
    <article className="group relative">
      <div className="flex flex-col gap-2 border-b border-zinc-200/70 py-6 dark:border-zinc-800/70">
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
          <time dateTime={post.date}>{formatDate(locale, post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{minRead}</span>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          <Link
            href={localizedPath(locale, `/blog/${post.slug}`)}
            className="text-zinc-900 transition group-hover:text-accent dark:text-zinc-100 dark:group-hover:text-accent"
          >
            {post.title}
          </Link>
        </h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{post.description}</p>
        <TagList tags={post.tags} locale={locale} ariaLabel={tagsAria} />
      </div>
    </article>
  )
}
