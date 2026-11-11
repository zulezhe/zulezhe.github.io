import type { Metadata } from "next"
import { siteConfig, pageMetadata } from "@/lib/site"
import { getDictionary, fmt, languageAlternates } from "@/lib/i18n"
import AboutContent from "@/components/pages/AboutContent"

const t = getDictionary("en")

export const metadata: Metadata = pageMetadata({
  title: t.about.title,
  description: fmt(t.about.metaDescription, { name: siteConfig.name }),
  path: "/about/",
  languages: languageAlternates("/about/"),
})

export default function AboutPage() {
  return <AboutContent locale="en" />
}
