"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { localizedPath, type Locale } from "@/lib/i18n/config"
import { fmt, formatDate } from "@/lib/i18n"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

export type SearchPost = {
  slug: string; title: string; description: string; date: string; tags: string[]; readingTime: number
}

export default function PostExplorer({
  posts,
  tags,
  locale = "en",
  copy,
}: {
  posts: SearchPost[]
  tags: string[]
  locale?: Locale
  copy?: Dictionary["explorer"]
}) {
  const t = copy
  const [query, setQuery] = useState("")
  const [tag, setTag] = useState("")
  const [sort, setSort] = useState("newest")
  const filtered = useMemo(() => {
    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
    return posts.filter(post => (!tag || post.tags.includes(tag)) && words.every(word =>
      `${post.title} ${post.description} ${post.tags.join(" ")}`.toLocaleLowerCase().includes(word)
    )).sort((a, b) => sort === "shortest" ? a.readingTime - b.readingTime : sort === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))
  }, [posts, query, tag, sort])
  const link = (path: string) => localizedPath(locale, path)
  const countLine = (count: number, inTag: string) =>
    t
      ? fmt(t.countLine, { count, inTag })
      : `${count} ${count === 1 ? "article" : "articles"}${inTag}`
  const inTagFor = (tag: string) => (tag ? (locale === "zh-TW" ? `（${tag}）` : ` in ${tag}`) : "")
  return <section aria-label="Explore articles">
    <div className="explorer-controls">
      <label htmlFor="post-search" className="mb-2 block text-sm font-medium">{t?.searchLabel ?? "Find something worth reading"}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="post-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t?.searchPlaceholder ?? "Search articles, topics, or tools…"} className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-transparent px-4 py-3 text-sm dark:border-zinc-700" />
        <select aria-label={t?.sortAria ?? "Sort articles"} value={sort} onChange={event => setSort(event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <option value="newest">{t?.sortNewest ?? "Newest first"}</option>
          <option value="oldest">{t?.sortOldest ?? "Oldest first"}</option>
          <option value="shortest">{t?.sortShortest ?? "Quick reads first"}</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label={t?.filterByTopicAria ?? "Filter by topic"}>
        {["", ...tags].map(value => <button type="button" key={value} aria-pressed={tag === value} onClick={() => setTag(value)} className={`topic-filter ${tag === value ? "is-selected" : ""}`}>{value || t?.allTopics || "All topics"}<span className="ml-1.5 opacity-70">{value ? posts.filter(p => p.tags.includes(value)).length : posts.length}</span></button>)}
      </div>
    </div>
    <div className="mt-6 flex items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
      <p role="status" aria-live="polite">{countLine(filtered.length, inTagFor(tag))}</p>
      {(query || tag) && <button type="button" className="text-accent hover:underline" onClick={() => { setQuery(""); setTag("") }}>{t?.clearFilters ?? "Clear filters"}</button>}
    </div>
    {filtered.length ? filtered.map(post => <article key={post.slug} className="post-result border-b border-zinc-200 py-6 dark:border-zinc-800">
      <div className="mb-2 flex gap-3 text-xs text-zinc-500 dark:text-zinc-400"><time dateTime={post.date}>{formatDate(locale, post.date)}</time><span>·</span><span>{t ? fmt(t.minRead, { count: post.readingTime }) : `${post.readingTime} min read`}</span></div>
      <h2 className="text-lg font-semibold tracking-tight"><Link href={link(`/blog/${post.slug}`)} className="transition-colors hover:text-accent">{post.title}<span className="result-arrow ml-2 inline-block text-accent" aria-hidden="true">{t?.resultArrow ?? "→"}</span></Link></h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{post.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">{post.tags.map(topic => <button key={topic} type="button" onClick={() => setTag(topic)} className="text-xs text-accent hover:underline" aria-label={t ? fmt(t.filterByTagAria, { tag: topic }) : `Filter by ${topic}`}>#{topic}</button>)}</div>
    </article>) : <div className="py-16 text-center"><h2 className="text-lg font-semibold">{t?.noResultsTitle ?? "No articles found"}</h2><p className="mt-2 text-sm text-zinc-500">{t?.noResultsHint ?? "Try another keyword or choose a different topic."}</p><button type="button" onClick={() => { setQuery(""); setTag("") }} className="mt-5 text-sm text-accent hover:underline">{t?.showAll ?? "Show all articles"}</button></div>}
  </section>
}
