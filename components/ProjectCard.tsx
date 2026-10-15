import Link from "next/link"
import type { Project } from "@/lib/projects"

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 transition hover:border-accent/40 hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-accent/40">
      <div className="flex-1">
        <h2 className="text-lg font-semibold tracking-tight">
          <Link
            href={`/projects/${project.slug}`}
            className="text-zinc-900 transition group-hover:text-accent dark:text-zinc-100 dark:group-hover:text-accent"
          >
            {project.title}
          </Link>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{project.tagline}</p>
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
        {project.tech.map((t) => (
          <li
            key={t}
            className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          >
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-4 text-sm font-medium">
        <Link
          href={`/projects/${project.slug}`}
          className="text-accent transition hover:underline"
        >
          Read more →
        </Link>
        {project.links.demo ? (
          <a
            href={project.links.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Live demo
          </a>
        ) : null}
        {project.links.repo ? (
          <a
            href={project.links.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Source
          </a>
        ) : null}
      </div>
    </article>
  )
}
