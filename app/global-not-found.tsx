"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { siteConfig } from "@/lib/site"
import { locales, localeTags, localePrefixes, type Locale } from "@/lib/i18n/config"
import { localizedPath } from "@/lib/i18n"

/**
 * Global 404 (experimental.globalNotFound). Rendered as a complete document
 * because with multiple root layouts there is no single root <html> to wrap
 * it. The locale is read from the URL prefix: /zh-TW/…, /de/… and /fr/… show
 * their own language, everything else falls back to English.
 *
 * This file is compiled to a single static 404.html, so the browser picks the
 * language at runtime from window.location.pathname. The very first paint uses
 * English (the server has no window); an effect swaps in the right copy and
 * fixes <html lang> / <title> immediately after hydration.
 */
type Copy = {
  title: string
  body: string
  backHome: string
  readBlog: string
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: "Page not found",
    body: "The page you're looking for doesn't exist or has moved. It happens.",
    backHome: "Back home",
    readBlog: "Read the blog",
  },
  "zh-TW": {
    title: "找不到頁面",
    body: "你要找的頁面不存在或已經搬家。難免啦。",
    backHome: "回首頁",
    readBlog: "閱讀部落格",
  },
  de: {
    title: "Seite nicht gefunden",
    body: "Die Seite, die du suchst, existiert nicht mehr oder ist umgezogen. Passiert.",
    backHome: "Zur Startseite",
    readBlog: "Zum Blog",
  },
  fr: {
    title: "Page introuvable",
    body: "La page que vous cherchez n'existe plus ou a été déplacée. Ça arrive.",
    backHome: "Accueil",
    readBlog: "Lire le blog",
  },
}

/** Detect the locale from any path under a locale prefix, including deep 404s. */
function localeFromPath(pathname: string): Locale {
  for (const locale of locales) {
    const prefix = localePrefixes[locale]
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) return locale
  }
  return "en"
}

export default function GlobalNotFound() {
  // Server render and first client render are English so hydration matches;
  // the effect then switches to the URL's locale.
  const [locale, setLocale] = useState<Locale>("en")
  const copy = COPY[locale]

  useEffect(() => {
    const detected = localeFromPath(window.location.pathname)
    setLocale(detected)
    document.documentElement.lang = localeTags[detected]
    document.title = `${COPY[detected].title} — ${siteConfig.name}`
  }, [])

  return (
    <html lang={localeTags[locale]} suppressHydrationWarning>
      <head>
        <title>{`${copy.title} — ${siteConfig.name}`}</title>
        <meta name="robots" content="noindex" />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-zinc-800 antialiased dark:bg-zinc-950 dark:text-zinc-200">
        <div className="mx-auto flex max-w-2xl flex-col items-start px-6 py-32">
          <p className="font-mono text-sm text-accent">404</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {copy.title}
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">{copy.body}</p>
          <div className="mt-8 flex gap-4">
            <Link
              href={localizedPath(locale, "/")}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {copy.backHome}
            </Link>
            <Link
              href={localizedPath(locale, "/blog/")}
              className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              {copy.readBlog}
            </Link>
          </div>
          <p className="mt-10 text-sm text-zinc-400">
            {siteConfig.name}
            <span className="text-accent">.</span>
          </p>
        </div>
      </body>
    </html>
  )
}
