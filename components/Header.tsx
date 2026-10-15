"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { siteConfig } from "@/lib/site"
import ThemeToggle from "./ThemeToggle"

const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
]

export default function Header() {
  const pathname = usePathname() ?? "/"

  const isActive = (href: string) =>
    pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-zinc-900 transition hover:text-accent dark:text-zinc-100"
        >
          {siteConfig.name}
          <span className="text-accent">.</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
