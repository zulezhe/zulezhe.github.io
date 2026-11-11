import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllProjects, getProjectBySlug } from "@/lib/projects"
import { absUrl, pageMetadata } from "@/lib/site"
import { getDictionary, fmt, languageAlternates } from "@/lib/i18n"
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

  return pageMetadata({
    title: project.title,
    description: project.description,
    path: `/projects/${project.slug}/`,
    type: "article",
    publishedTime: project.date,
    tags: project.tech,
    ogImage: {
      url: absUrl(`/projects/${project.slug}/opengraph-image`),
      alt: project.title,
    },
    languages: languageAlternates(`/projects/${project.slug}/`),
  })
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  return <ProjectDetailContent locale="en" slug={slug} />
}
