import { absUrl } from "@/lib/site"
import { defaultLocale, isLocale, localeTags, locales, type Locale } from "./config"
import en, { type Dictionary } from "./dictionaries/en"
import zhTW from "./dictionaries/zh-TW"

export { locales, defaultLocale, isLocale, localeTags, localizedPath } from "./config"
export type { Locale } from "./config"

const dictionaries: Record<Locale, Dictionary> = { en, "zh-TW": zhTW }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

/**
 * Replace `{key}` placeholders and `{key|singular|plural}` inline-plural
 * tokens (singular when the numeric value of `key` is 1). Zero runtime
 * dependencies — enough for this site's handful of count strings.
 */
export function fmt(
  template: string,
  values: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)(\|([^|]*)\|([^}]*))?\}/g, (match, key, _plural, singular, plural) => {
    const value = values[key]
    if (value === undefined) return match
    if (singular !== undefined && plural !== undefined) {
      return Number(value) === 1 ? singular : plural
    }
    return String(value)
  })
}

/** Locale-aware date: "January 5, 2026" (en) / "2026年1月5日" (zh-TW). */
export function formatDate(locale: Locale, iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(localeTags[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

/**
 * hreflang pair for a site path: en points at the prefix-less URL,
 * zh-TW at the prefixed one, x-default at English. English posts that
 * already carry frontmatter `translations` keep their richer pair
 * (managed in the blog page itself).
 */
export function languageAlternates(path: string): Record<string, string> {
  const enUrl = absUrl(path)
  const clean = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`
  return {
    en: enUrl,
    "zh-TW": absUrl(`/zh-TW${clean || ""}/`),
    "x-default": enUrl,
  }
}
