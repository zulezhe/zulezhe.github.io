import type { Metadata } from "next"
import { siteConfig, pageMetadata } from "@/lib/site"
import { languageAlternates } from "@/lib/i18n"
import HomeContent from "@/components/pages/HomeContent"

export const metadata: Metadata = pageMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: "/",
  languages: languageAlternates("/"),
})

export default function HomePage() {
  return <HomeContent locale="en" />
}
