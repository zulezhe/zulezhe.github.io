"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

export type SearchPost = {
  slug: string; title: string; description: string; date: string; tags: string[]; readingTime: number
}

export default function PostExplorer({ posts, tags }: { posts: SearchPost[]; tags: string[] }) {
  const [query, setQuery] = useState("")
  const [tag, setTag] = useState("")
  const [sort, setSort] = useState("newest")
  const filtered = useMemo(() => {
    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
    return posts.filter(post => (!tag || post.tags.includes(tag)) && words.every(word =>
      `${post.title} ${post.description} ${post.tags.join(" ")}`.toLocaleLowerCase().includes(word)
    )).sort((a, b) => sort === "shortest" ? a.readingTime - b.readingTime : sort === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))
  }, [posts, query, tag, sort])
  return <section aria-label="Explore articles">
    <div className="explorer-controls">
      <label htmlFor="post-search" className="mb-2 block text-sm font-medium">Find something worth reading</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="post-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search articles, topics, or tools…" className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-transparent px-4 py-3 text-sm dark:border-zinc-700" />
        <select aria-label="Sort articles" value={sort} onChange={event => setSort(event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="shortest">Quick reads first</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter by topic">
        {["", ...tags].map(value => <button type="button" key={value} aria-pressed={tag === value} onClick={() => setTag(value)} className={`topic-filter ${tag === value ? "is-selected" : ""}`}>{value || "All topics"}<span className="ml-1.5 opacity-70">{value ? posts.filter(p => p.tags.includes(value)).length : posts.length}</span></button>)}
      </div>
    </div>
    <div className="mt-6 flex items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
      <p role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? "article" : "articles"}{tag ? ` in ${tag}` : ""}</p>
      {(query || tag) && <button type="button" className="text-accent hover:underline" onClick={() => { setQuery(""); setTag("") }}>Clear filters</button>}
    </div>
    {filtered.length ? filtered.map(post => <article key={post.slug} className="post-result border-b border-zinc-200 py-6 dark:border-zinc-800">
      <div className="mb-2 flex gap-3 text-xs text-zinc-500 dark:text-zinc-400"><time dateTime={post.date}>{new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</time><span>·</span><span>{post.readingTime} min read</span></div>
      <h2 className="text-lg font-semibold tracking-tight"><Link href={`/blog/${post.slug}`} className="transition-colors hover:text-accent">{post.title}<span className="result-arrow ml-2 inline-block text-accent" aria-hidden="true">→</span></Link></h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{post.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">{post.tags.map(topic => <button key={topic} type="button" onClick={() => setTag(topic)} className="text-xs text-accent hover:underline" aria-label={`Filter by ${topic}`}>#{topic}</button>)}</div>
    </article>) : <div className="py-16 text-center"><h2 className="text-lg font-semibold">No articles found</h2><p className="mt-2 text-sm text-zinc-500">Try another keyword or choose a different topic.</p><button type="button" onClick={() => { setQuery(""); setTag("") }} className="mt-5 text-sm text-accent hover:underline">Show all articles</button></div>}
  </section>
}
