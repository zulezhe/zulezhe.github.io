"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { siteConfig } from "@/lib/site"
import { localizedPath, type Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import ThemeToggle from "./ThemeToggle"
import LocaleSwitcher from "./LocaleSwitcher"

type NavCopy = Dictionary["nav"]

export default function Header({
  locale,
  copy,
  themeCopy,
  localeSwitcherCopy,
}: {
  locale: Locale
  copy: NavCopy
  themeCopy: Dictionary["themeToggle"]
  localeSwitcherCopy: Dictionary["localeSwitcher"]
}) {
  const pathname = usePathname() ?? "/"
  const link = (path: string) => localizedPath(locale, path)

  const NAV = [
    { href: link("/blog"), label: copy.blog },
    { href: link("/projects"), label: copy.projects },
    { href: link("/about"), label: copy.about },
  ]

  const isActive = (href: string) => {
    const clean = href.replace(/\/+$/, "") || "/"
    return pathname === clean || pathname === `${clean}/` || pathname.startsWith(`${clean}/`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href={link("/")}
          className="text-[15px] font-semibold tracking-tight text-zinc-900 transition hover:text-accent dark:text-zinc-100"
        >
          {siteConfig.name}
          <span className="text-accent">.</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label={copy.ariaLabel}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive(item.href)
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-1 sm:ml-2">
            <ThemeToggle copy={themeCopy} />
          </div>
          <div className="ml-0.5">
            <LocaleSwitcher locale={locale} copy={localeSwitcherCopy} />
          </div>
        </nav>
      </div>
    </header>
  )
}
