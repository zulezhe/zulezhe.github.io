"use client"

import { useEffect, useRef, useState } from "react"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

export default function ReadingTools({ copy }: { copy: Dictionary["readingTools"] }) {
  const [progress, setProgress] = useState(0)
  const [large, setLarge] = useState(false)
  const [message, setMessage] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const article = document.querySelector<HTMLElement>(".article-content")
    let frame = 0
    const update = () => {
      if (!article) return
      const top = article.getBoundingClientRect().top + window.scrollY
      const distance = Math.max(1, article.offsetHeight - window.innerHeight + 120)
      setProgress(Math.max(0, Math.min(100, (window.scrollY - top + 120) / distance * 100)))
    }
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    const observer = new ResizeObserver(onScroll)
    if (article) observer.observe(article)
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); observer.disconnect(); if (timer.current) clearTimeout(timer.current) }
  }, [])
  useEffect(() => {
    document.querySelector(".article-content")?.classList.toggle("reading-large", large)
    return () => { document.querySelector(".article-content")?.classList.remove("reading-large") }
  }, [large])
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setMessage(copy.linkCopied) }
    catch { setMessage(copy.copyFailed) }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(""), 3500)
  }
  return <>
    <div className="reading-progress" role="progressbar" aria-label={copy.progressAria} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div style={{ transform: `scaleX(${progress / 100})` }} /></div>
    <div className="reading-tools flex flex-wrap items-center gap-2 border-y border-zinc-200 py-3 dark:border-zinc-800">
      <span className="mr-auto text-xs text-zinc-500 dark:text-zinc-400">{copy.comfort}</span>
      <button type="button" aria-pressed={large} onClick={() => setLarge(!large)} className="reader-button">{large ? copy.defaultText : copy.largerText}</button>
      <button type="button" onClick={copyLink} className="reader-button">{copy.copyLink}</button>
      <span role="status" className="w-full text-xs text-accent" hidden={!message}>{message}</span>
    </div>
    {progress > 15 && <button type="button" className="back-to-top" aria-label={copy.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 12 6-6 6 6M12 6v14" /></svg><span className="hidden sm:inline">{copy.backToTop}</span></button>}
  </>
}
