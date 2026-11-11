"use client"

import { useEffect } from "react"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

/**
 * Progressive enhancement: adds a copy button to every code block.
 * Works on the server-rendered markdown HTML after hydration.
 */
export default function CopyCode({ copy }: { copy?: Dictionary["copyCode"] }) {
  const label = copy?.copy ?? "Copy"
  const copied = copy?.copied ?? "Copied!"
  const failed = copy?.failed ?? "Failed"

  useEffect(() => {
    const buttons: HTMLElement[] = []

    for (const pre of Array.from(document.querySelectorAll<HTMLPreElement>(".prose pre"))) {
      if (pre.querySelector(".copy-button")) continue
      const button = document.createElement("button")
      button.type = "button"
      button.className =
        "copy-button absolute right-2.5 top-2.5 rounded-md border border-zinc-200 bg-white/90 px-2 py-1 text-xs font-medium text-zinc-500 opacity-0 transition hover:text-zinc-900 focus-visible:opacity-100 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:text-zinc-100 group-hover:opacity-100"
      button.textContent = label
      button.addEventListener("click", async () => {
        const code = pre.querySelector("code")
        if (!code) return
        try {
          await navigator.clipboard.writeText(code.innerText)
          button.textContent = copied
        } catch {
          button.textContent = failed
        }
        setTimeout(() => {
          button.textContent = label
        }, 1600)
      })
      pre.appendChild(button)
      buttons.push(button)
    }

    return () => {
      for (const button of buttons) button.remove()
    }
  }, [label, copied, failed])

  return null
}
