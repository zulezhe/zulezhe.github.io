import type { Metadata } from "next"
import { siteConfig, pageMetadata } from "@/lib/site"
import { languageAlternates, localizedPath } from "@/lib/i18n"
import HomeContent from "@/components/pages/HomeContent"

const path = localizedPath("zh-TW", "/")

export const metadata: Metadata = pageMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path,
  languages: languageAlternates("/"),
})

export default function ZhtwHomePage() {
  return <HomeContent locale="zh-TW" />
}
