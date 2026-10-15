import type { Metadata } from "next"
import { getAllProjects } from "@/lib/projects"
import { siteConfig, absUrl } from "@/lib/site"
import ProjectCard from "@/components/ProjectCard"
import JsonLd from "@/components/JsonLd"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected projects and side builds by " +
    siteConfig.name +
    " — web apps, developer tools and open-source experiments, with live demos and source code.",
  alternates: { canonical: "/projects/" },
}

export default function ProjectsPage() {
  const projects = getAllProjects()

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Projects by ${siteConfig.name}`,
          description: "Selected projects, apps and open-source work.",
          url: absUrl("/projects/"),
          isPartOf: { "@type": "WebSite", name: siteConfig.name, url: absUrl("/") },
          hasPart: projects.map((p) => ({
            "@type": "CreativeWork",
            name: p.title,
            description: p.description,
            url: absUrl(`/projects/${p.slug}/`),
          })),
        }}
      />

      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Projects
          </h1>
          <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
            A selection of things I&apos;ve built — from small experiments to tools I use every
            day. Each project page has the full story, the tech stack, and links to try it
            yourself.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </>
  )
}
