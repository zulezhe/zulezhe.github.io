import Link from "next/link"
import { siteConfig } from "@/lib/site"
import { GitHubIcon, MailIcon, RssIcon, XIcon } from "./Icons"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-200/70 dark:border-zinc-800/70">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Built with Next.js · statically exported · hosted for free
          </p>
        </div>

        <nav className="flex items-center gap-4" aria-label="Social links">
          {siteConfig.links.github ? (
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label="GitHub"
              className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <GitHubIcon />
            </a>
          ) : null}
          {siteConfig.links.twitter ? (
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label="X (Twitter)"
              className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <XIcon />
            </a>
          ) : null}
          {siteConfig.links.email ? (
            <a
              href={siteConfig.links.email}
              aria-label="Email"
              className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <MailIcon />
            </a>
          ) : null}
          <Link
            href="/rss.xml"
            aria-label="RSS feed"
            className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <RssIcon />
          </Link>
        </nav>
      </div>
    </footer>
  )
}
