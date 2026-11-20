"use client"

import "./globals.css"

import Link from "next/link"
import { useEffect, useState } from "react"
import { siteConfig } from "@/lib/site"
import { Locale, getDictionary, locales, localeTags, localePrefixes } from "@/lib/i18n"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

/**
 * Global 404 (experimental.globalNotFound). Static export produces ONE
 * /404.html shared by every locale, so it cannot inherit any of the four root
 * layouts. We rebuild the same page frame here (globals.css, theme init,
 * Header/Footer, main, Footer) and pick the language at runtime from the URL.
 *
 * Server render and first client paint are English (no window on the server),
 * so hydration matches. An effect then swaps in the URL's locale.
 */

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})()`

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

/** Build the localized path from a locale prefix, with a guaranteed slash. */
function localizedHref(locale: Locale, path: string): string {
  const prefix = localePrefixes[locale]
  const clean = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`
  return `${prefix}${clean}/`
}

export default function GlobalNotFound() {
  const [locale, setLocale] = useState<Locale>("en")
  const copy = COPY[locale]
  const dict = getDictionary(locale)

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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-zinc-800 antialiased dark:bg-zinc-950 dark:text-zinc-200">
        <a className="skip-link" href="#main-content">{dict.nav.skipToContent}</a>
        <Header
          locale={locale}
          copy={dict.nav}
          themeCopy={dict.themeToggle}
          localeSwitcherCopy={dict.localeSwitcher}
        />
        <main id="main-content" tabIndex={-1} className="flex-1">
          <div className="mx-auto flex max-w-2xl flex-col items-start px-6 py-32">
            <p className="font-mono text-sm text-accent">404</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              {copy.title}
            </h1>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">{copy.body}</p>
            <div className="mt-8 flex gap-4">
              <Link
                href={localizedHref(locale, "/")}
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {copy.backHome}
              </Link>
              <Link
                href={localizedHref(locale, "/blog")}
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
        </main>
        <Footer copy={dict.footer} locale={locale} />
      </body>
    </html>
  )
}
