import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllProjects, getProjectBySlug } from "@/lib/projects"
import { absUrl, pageMetadata } from "@/lib/site"
import { languageAlternates, localizedPath } from "@/lib/i18n"
import ProjectDetailContent from "@/components/pages/ProjectDetailContent"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllProjects({ includeDrafts: true }).map((project) => ({ slug: project.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = getProjectBySlug(slug, true)
  if (!project) notFound()

  const enPath = `/projects/${project.slug}/`
  return pageMetadata({
    title: project.title,
    description: project.description,
    path: localizedPath("zh-TW", enPath),
    type: "article",
    publishedTime: project.date,
    tags: project.tech,
    ogImage: {
      url: absUrl(`/projects/${project.slug}/opengraph-image`),
      alt: project.title,
    },
    languages: languageAlternates(enPath),
  })
}

export default async function ZhtwProjectPage({ params }: Props) {
  const { slug } = await params
  return <ProjectDetailContent locale="zh-TW" slug={slug} />
}
