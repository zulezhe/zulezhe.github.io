import type { Heading } from "@/lib/markdown"

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        On this page
      </p>
      <ul className="space-y-2 border-l border-zinc-200 dark:border-zinc-800">
        {headings.map((h) => (
          <li key={h.id} className={h.depth === 3 ? "pl-5" : "pl-4"}>
            <a
              href={`#${h.id}`}
              className="-ml-px block border-l border-transparent pl-3 leading-snug text-zinc-600 transition hover:border-accent hover:text-accent dark:text-zinc-400"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
