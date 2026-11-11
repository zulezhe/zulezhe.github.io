import Link from "next/link"

export default function TagList({
  tags,
  locale = "en",
  ariaLabel = "Tags",
}: {
  tags: string[]
  locale?: "en" | "zh-TW"
  ariaLabel?: string
}) {
  if (tags.length === 0) return null
  const href = (tag: string) =>
    locale === "en" ? `/blog/tag/${encodeURIComponent(tag)}` : `/zh-TW/blog/tag/${encodeURIComponent(tag)}/`
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={ariaLabel}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={href(tag)}
            className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 transition hover:bg-accent/10 hover:text-accent dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-accent/15 dark:hover:text-accent"
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  )
}
