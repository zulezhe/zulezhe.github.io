"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { localeNames, locales, type Locale } from "@/lib/i18n/config"

/**
 * Manual language switcher. Derives the counterpart URL from the current
 * pathname by adding/removing the /zh-TW prefix — no client i18n runtime.
 */
export default function LocaleSwitcher({
  locale,
  copy,
}: {
  locale: Locale
  copy: { aria: string }
}) {
  const pathname = usePathname() || "/"

  const target = (target: Locale): string => {
    const bare = locale === "zh-TW" ? pathname.replace(/^\/zh-TW(?=\/|$)/, "") || "/" : pathname
    if (target === locale) return bare
    if (target === "zh-TW") return bare === "/" ? "/zh-TW/" : `/zh-TW${bare}`
    return bare
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
