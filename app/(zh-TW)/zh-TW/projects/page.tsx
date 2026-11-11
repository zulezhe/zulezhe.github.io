import type { Metadata } from "next"
import { siteConfig, pageMetadata } from "@/lib/site"
import { getDictionary, fmt, languageAlternates, localizedPath } from "@/lib/i18n"
import ProjectsContent from "@/components/pages/ProjectsContent"

const t = getDictionary("zh-TW")
const enPath = "/projects/"

export const metadata: Metadata = pageMetadata({
  title: t.projects.title,
  description: fmt(t.projects.metaDescription, { name: siteConfig.name }),
  path: localizedPath("zh-TW", enPath),
  languages: languageAlternates(enPath),
})

export default function ZhtwProjectsPage() {
  return <ProjectsContent locale="zh-TW" />
}
