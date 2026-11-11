import Link from "next/link"
import type { Project } from "@/lib/projects"
import { localizedPath, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n"

export default function ProjectCard({ project, locale = "en" }: { project: Project; locale?: Locale }) {
  const t = getDictionary(locale)
  return (
    <article className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 transition hover:border-accent/40 hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-accent/40">
      <div className="flex-1">
        <h2 className="text-lg font-semibold tracking-tight">
          <Link
            href={localizedPath(locale, `/projects/${project.slug}`)}
            className="text-zinc-900 transition group-hover:text-accent dark:text-zinc-100 dark:group-hover:text-accent"
          >
            {project.title}
          </Link>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{project.tagline}</p>
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={t.projects.techStackAria}>
        {project.tech.map((tech) => (
          <li
            key={tech}
            className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-4 text-sm font-medium">
        <Link
          href={localizedPath(locale, `/projects/${project.slug}`)}
          className="text-accent transition hover:underline"
        >
          {t.projects.cardReadMore}
        </Link>
        {project.links.demo ? (
          <a
            href={project.links.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t.projects.cardLiveDemo}
          </a>
        ) : null}
        {project.links.repo ? (
          <a
            href={project.links.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t.projects.cardSource}
          </a>
        ) : null}
      </div>
    </article>
  )
}
