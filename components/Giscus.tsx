"use client"

import { useEffect, useRef } from "react"
import { siteConfig } from "@/lib/site"

/**
 * Comments via giscus (GitHub Discussions). Free, no server needed.
 * Enable by filling in `giscus` in lib/site.ts — https://giscus.app
 */
export default function Giscus() {
  const ref = useRef<HTMLDivElement>(null)
  const config = siteConfig.giscus

  useEffect(() => {
    if (!config || !ref.current || ref.current.childElementCount > 0) return

    const script = document.createElement("script")
    script.src = "https://giscus.app/client.js"
    script.async = true
    script.crossOrigin = "anonymous"
    script.setAttribute("data-repo", config.repo)
    script.setAttribute("data-repo-id", config.repoId)
    script.setAttribute("data-category", config.category)
    script.setAttribute("data-category-id", config.categoryId)
    script.setAttribute("data-mapping", "pathname")
    script.setAttribute("data-strict", "0")
    script.setAttribute("data-reactions-enabled", "1")
    script.setAttribute("data-emit-metadata", "0")
    script.setAttribute("data-input-position", "top")
    script.setAttribute("data-theme", "preferred_color_scheme")
    script.setAttribute("data-lang", "en")
    ref.current.appendChild(script)
  }, [config])

  if (!config) return null

  return (
    <section aria-label="Comments" className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Comments</h2>
      <div ref={ref} />
    </section>
  )
}
