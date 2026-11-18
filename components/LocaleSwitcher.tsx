"use client"

import { usePathname } from "next/navigation"
import { localeNames, localePrefixes, locales, defaultLocale, type Locale } from "@/lib/i18n/config"

/**
 * Language switcher as a <select>. Derives the counterpart URL from the
 * current pathname by swapping the locale prefix — no client i18n runtime.
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

  const urlFor = (target: Locale): string => {
    const bare = stripPrefix(pathname)
    if (target === defaultLocale) return bare
    const prefix = localePrefixes[target] || `/${target}`
    return bare === "/" ? `${prefix}/` : `${prefix}${bare}`
  }

  return (
    <select
      aria-label={copy.aria}
      value={locale}
      onChange={(e) => {
        const target = locales.find((l) => l === e.target.value)
        if (target) window.location.assign(urlFor(target))
      }}
      className="rounded-full border border-zinc-300 bg-transparent px-2.5 py-1 text-xs font-medium text-zinc-700 outline-none transition hover:border-zinc-400 focus:border-accent dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:focus:border-accent"
    >
      {locales.map((item) => (
        <option key={item} value={item} lang={item} className="bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {localeNames[item]}
        </option>
      ))}
    </select>
  )
}
