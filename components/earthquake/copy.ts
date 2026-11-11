import { getDictionary, type Locale } from "@/lib/i18n"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

export type EqCopy = Dictionary["earthquake"]

/** UI copy for the earthquake visualisation, resolved from the main dictionaries. */
export function eqCopy(locale: Locale): EqCopy {
  return getDictionary(locale).earthquake
}

/** BCP47 tag for Intl formatting inside the earthquake components. */
export function eqLocaleTag(locale: Locale): string {
  return locale === "zh-TW" ? "zh-TW" : "en-US"
}
