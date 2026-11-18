export const locales = ["en", "zh-TW", "de", "fr"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  de: "Deutsch",
  fr: "Français",
}

/** BCP47 tag used for <html lang>, og:locale and Intl. */
export const localeTags: Record<Locale, string> = {
  en: "en",
  "zh-TW": "zh-TW",
  de: "de",
  fr: "fr",
}

/** Open Graph locale (underscore form). */
export const ogLocales: Record<Locale, string> = {
  en: "en_US",
  "zh-TW": "zh_TW",
  de: "de_DE",
  fr: "fr_FR",
}

/**
 * URL prefix for each locale. English stays prefix-less so current search
 * rankings are untouched; every other locale serves under /<prefix>/.
 */
export const localePrefixes: Record<Locale, string> = {
  en: "",
  "zh-TW": "/zh-TW",
  de: "/de",
  fr: "/fr",
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/**
 * Prefix a site path with the locale segment. English keeps its existing,
 * prefix-less URLs so current search rankings are untouched.
 *
 * Page paths always end with a trailing slash. The CDN in front of this site
 * resolves `/blog/post` to `blog/post/index.html` and serves it with 200
 * instead of redirecting, so every slash-less URL is a second indexable copy
 * of the same page. Emitting the slash form in all internal links keeps
 * crawlers and link equity on the canonical URL.
 */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`
  const prefix = localePrefixes[locale] || `/${locale}`
  return locale === defaultLocale ? `${clean}/` : `${prefix}${clean}/`
}
