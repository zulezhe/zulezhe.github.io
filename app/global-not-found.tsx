"use client"

import Link from "next/link"
import { useEffect } from "react"
import { siteConfig } from "@/lib/site"

/**
 * Global 404 (experimental.globalNotFound). Rendered as a complete document
 * because with multiple root layouts there is no single root <html> to wrap
 * it. Language is picked from the URL: /zh-TW/… gets Traditional Chinese,
 * everything else English.
 */
export default function GlobalNotFound() {
  const isZhtw =
    typeof window !== "undefined" && window.location.pathname.replace(/\/+$/, "").endsWith("/zh-TW")

  useEffect(() => {
    document.documentElement.lang = isZhtw ? "zh-TW" : "en"
  }, [isZhtw])

  const copy = isZhtw
    ? {
        code: "404",
        title: "找不到頁面",
        body: "你要找的頁面不存在或已經搬家。難免啦。",
        backHome: "回首頁",
        readBlog: "閱讀部落格",
      }
    : {
        code: "404",
        title: "Page not found",
        body: "The page you're looking for doesn't exist or has moved. It happens.",
        backHome: "Back home",
        readBlog: "Read the blog",
      }

  return (
    <html lang={isZhtw ? "zh-TW" : "en"} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-white font-sans text-zinc-800 antialiased dark:bg-zinc-950 dark:text-zinc-200">
        <div className="mx-auto flex max-w-2xl flex-col items-start px-6 py-32">
          <p className="font-mono text-sm text-accent">{copy.code}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {copy.title}
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">{copy.body}</p>
          <div className="mt-8 flex gap-4">
            <Link
              href={isZhtw ? "/zh-TW/" : "/"}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {copy.backHome}
            </Link>
            <Link
              href={isZhtw ? "/zh-TW/blog/" : "/blog"}
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
