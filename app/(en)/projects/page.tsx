import type { Metadata } from "next"
import { siteConfig, pageMetadata } from "@/lib/site"
import { getDictionary, fmt, languageAlternates } from "@/lib/i18n"
import ProjectsContent from "@/components/pages/ProjectsContent"

const t = getDictionary("en")

export const metadata: Metadata = pageMetadata({
  title: t.projects.title,
  description: fmt(t.projects.metaDescription, { name: siteConfig.name }),
  path: "/projects/",
  languages: languageAlternates("/projects/"),
})

export default function ProjectsPage() {
  return <ProjectsContent locale="en" />
}
