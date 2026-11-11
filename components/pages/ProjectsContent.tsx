import { siteConfig, absUrl } from "@/lib/site"
import { getDictionary, fmt, localizedPath, type Locale } from "@/lib/i18n"
import { getAllProjects } from "@/lib/projects"
import ProjectCard from "@/components/ProjectCard"
import JsonLd from "@/components/JsonLd"

export default async function ProjectsContent({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  const projects = getAllProjects()

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${t.projects.title} — ${siteConfig.name}`,
          description: t.projects.intro,
          url: absUrl(localizedPath(locale, "/projects/")),
          isPartOf: { "@type": "WebSite", name: siteConfig.name, url: absUrl("/") },
          hasPart: projects.map((p) => ({
            "@type": "CreativeWork",
            name: p.title,
            description: p.description,
            url: absUrl(localizedPath(locale, `/projects/${p.slug}/`)),
          })),
        }}
      />

      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {t.projects.title}
          </h1>
          <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
            {t.projects.intro}
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} locale={locale} />
          ))}
        </div>
      </div>
    </>
  )
}
