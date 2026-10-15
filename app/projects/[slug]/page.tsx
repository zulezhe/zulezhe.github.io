import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllProjects, getProjectBySlug } from "@/lib/projects"
import { renderMarkdown } from "@/lib/markdown"
import { siteConfig, absUrl } from "@/lib/site"
import JsonLd from "@/components/JsonLd"
import CopyCode from "@/components/CopyCode"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllProjects({ includeDrafts: true }).map((project) => ({ slug: project.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = getProjectBySlug(slug, true)
  if (!project) return {}

  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}/` },
    openGraph: {
      type: "article",
      url: `/projects/${project.slug}/`,
      title: project.title,
      description: project.description,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
    },
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const project = getProjectBySlug(slug)
  if (!project) notFound()

  const { html } = await renderMarkdown(project.content)
  const projectUrl = absUrl(`/projects/${project.slug}/`)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    headline: project.title,
    description: project.description,
    dateCreated: project.date,
    datePublished: project.date,
    inLanguage: "en",
    url: projectUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": projectUrl },
    keywords: project.tech.join(", "),
    author: {
      "@type": "Person",
      name: siteConfig.name,
      url: absUrl("/about/"),
    },
    ...(project.links.repo ? { codeRepository: project.links.repo } : {}),
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
      { "@type": "ListItem", position: 2, name: "Projects", item: absUrl("/projects/") },
      { "@type": "ListItem", position: 3, name: project.title, item: projectUrl },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-500">
          <Link href="/projects" className="transition hover:text-accent">← All projects</Link>
        </nav>

        <article>
          <header>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              {project.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {project.tagline}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500">
              <time dateTime={project.date}>{project.date}</time>
              <span aria-hidden="true">·</span>
              {project.links.demo ? (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent transition hover:underline"
                >
                  Live demo ↗
                </a>
              ) : null}
              {project.links.repo ? (
                <a
                  href={project.links.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent transition hover:underline"
                >
                  Source code ↗
                </a>
              ) : null}
            </div>

            <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Tech stack">
              {project.tech.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                >
                  {t}
                </li>
              ))}
            </ul>
          </header>

          <hr className="my-8 border-zinc-200/70 dark:border-zinc-800/70" />

          <div
            className="prose prose-zinc dark:prose-invert
              prose-headings:tracking-tight
              prose-a:font-medium prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-accent/50
              prose-code:before:content-none prose-code:after:content-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </div>

      <CopyCode />
    </>
  )
}
