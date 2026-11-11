export const locales = ["en", "zh-TW"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
}

/** BCP47 tag used for <html lang>, og:locale and Intl. */
export const localeTags: Record<Locale, string> = {
  en: "en",
  "zh-TW": "zh-TW",
}

/** Open Graph locale (underscore form). */
export const ogLocales: Record<Locale, string> = {
  en: "en_US",
  "zh-TW": "zh_TW",
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/**
 * Prefix a site path with the locale segment. English keeps its existing,
 * prefix-less URLs so current search rankings are untouched.
 */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`
  return locale === defaultLocale ? `${clean || "/"}` : `/zh-TW${clean || ""}/`
}
