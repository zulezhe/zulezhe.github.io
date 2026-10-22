"use client"

import { useEffect, useState } from "react"
import type { Heading } from "@/lib/markdown"

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState("")
  useEffect(() => {
    let frame = 0
    const update = () => {
      let current = ""
      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (element && element.getBoundingClientRect().top <= 150) current = heading.id
      }
      setActive(current)
    }
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll) }
  }, [headings])
  if (headings.length < 2) return null
  return <nav aria-label="Table of contents" className="text-sm">
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">On this page</p>
    <ul className="space-y-2 border-l border-zinc-200 dark:border-zinc-800">
      {headings.map(h => <li key={h.id} className={h.depth === 3 ? "pl-5" : "pl-4"}>
        <a href={`#${h.id}`} aria-current={active === h.id ? "location" : undefined} onClick={() => setActive(h.id)} className={`-ml-px block border-l pl-3 leading-snug transition-colors hover:border-accent hover:text-accent ${active === h.id ? "border-accent font-medium text-accent" : "border-transparent text-zinc-600 dark:text-zinc-400"}`}>{h.text}</a>
      </li>)}
    </ul>
  </nav>
}
