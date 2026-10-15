import Link from "next/link"
import type { Post } from "@/lib/posts"
import { formatDate } from "@/lib/posts"
import TagList from "./TagList"

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="group relative">
      <div className="flex flex-col gap-2 border-b border-zinc-200/70 py-6 dark:border-zinc-800/70">
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime} min read</span>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          <Link
            href={`/blog/${post.slug}`}
            className="text-zinc-900 transition group-hover:text-accent dark:text-zinc-100 dark:group-hover:text-accent"
          >
            {post.title}
          </Link>
        </h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{post.description}</p>
        <TagList tags={post.tags} />
      </div>
    </article>
  )
}
