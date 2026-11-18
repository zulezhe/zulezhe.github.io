import type { Metadata } from "next"
import { siteConfig, pageMetadata } from "@/lib/site"
import { getDictionary, fmt, languageAlternates, localizedPath } from "@/lib/i18n"
import AboutContent from "@/components/pages/AboutContent"

const t = getDictionary("zh")
const enPath = "/about/"

export const metadata: Metadata = pageMetadata({
  title: t.about.title,
  description: fmt(t.about.metaDescription, { name: siteConfig.name }),
  path: localizedPath("zh", enPath),
  languages: languageAlternates(enPath),
})

export default function ZhtwAboutPage() {
  return <AboutContent locale="zh" />
}
