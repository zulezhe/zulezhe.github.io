"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { localeNames, localePrefixes, locales, defaultLocale, type Locale } from "@/lib/i18n/config"

/**
 * Manual language switcher. Derives the counterpart URL from the current
 * pathname by swapping the locale prefix — no client i18n runtime.
 * Works for any number of locales via localePrefixes.
 */
export default function LocaleSwitcher({
  locale,
  copy,
}: {
  locale: Locale
  copy: { aria: string }
}) {
  const pathname = usePathname() || "/"

  /** Strip any locale prefix, returning the bare path. */
  const stripPrefix = (p: string): string => {
    for (const loc of locales) {
      const prefix = localePrefixes[loc]
      if (prefix && p.startsWith(prefix)) {
        const rest = p.slice(prefix.length)
        return rest || "/"
      }
    }
    return p
  }

  const target = (target: Locale): string => {
    if (target === locale) return stripPrefix(pathname)
    const bare = stripPrefix(pathname)
    if (target === defaultLocale) return bare
    const prefix = localePrefixes[target] || `/${target}`
    return bare === "/" ? `${prefix}/` : `${prefix}${bare}`
  }

  return (
    <nav aria-label={copy.aria} className="flex items-center">
      {locales.map((item) =>
        item === locale ? (
          <span
            key={item}
            aria-current="true"
            className="rounded-full px-2 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100"
          >
            {localeNames[item]}
          </span>
        ) : (
          <Link
            key={item}
            href={target(item)}
            hrefLang={item}
            lang={item}
            className="rounded-full px-2 py-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {localeNames[item]}
          </Link>
        ),
      )}
    </nav>
  )
}
