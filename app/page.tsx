import Link from "next/link"
import type { Metadata } from "next"
import { siteConfig, absUrl } from "@/lib/site"
import { getAllPosts, formatDate } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import PostCard from "@/components/PostCard"
import ProjectCard from "@/components/ProjectCard"
import JsonLd from "@/components/JsonLd"
import { ArrowIcon, GitHubIcon, MailIcon, RssIcon, XIcon } from "@/components/Icons"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default function HomePage() {
  const posts = getAllPosts().slice(0, 4)
  const projects = getAllProjects()
    .filter((p) => p.featured)
    .slice(0, 3)

  const socials = [
    siteConfig.links.github ? { href: siteConfig.links.github, label: "GitHub", Icon: GitHubIcon } : null,
    siteConfig.links.twitter ? { href: siteConfig.links.twitter, label: "X", Icon: XIcon } : null,
    siteConfig.links.email ? { href: siteConfig.links.email, label: "Email", Icon: MailIcon } : null,
  ].filter(Boolean) as { href: string; label: string; Icon: typeof GitHubIcon }[]

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: siteConfig.title,
          description: siteConfig.description,
          url: absUrl("/"),
          isPartOf: { "@type": "WebSite", name: siteConfig.name, url: absUrl("/") },
        }}
      />

      <div className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="py-20 sm:py-28">
          <p className="mb-4 font-mono text-sm text-accent">Hi, my name is</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
            {siteConfig.name}
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-5 max-w-xl text-xl leading-relaxed text-zinc-600 dark:text-zinc-400">
            {siteConfig.tagline}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            I write about web development, developer tooling, and building sites that both
            Google and AI assistants love to recommend.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              View my work <ArrowIcon />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              Read the blog
            </Link>
            <span className="ml-1 flex items-center gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={label}
                  className="text-zinc-400 transition hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
              <Link
                href="/rss.xml"
                aria-label="RSS feed"
                className="text-zinc-400 transition hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
              >
                <RssIcon className="h-5 w-5" />
              </Link>
            </span>
          </div>
        </section>

        {/* Featured projects */}
        <section className="border-t border-zinc-200/70 py-16 dark:border-zinc-800/70" aria-labelledby="projects-heading">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 id="projects-heading" className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Featured projects
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                Things I&apos;ve designed, built and shipped.
              </p>
            </div>
            <Link
              href="/projects"
              className="hidden text-sm font-medium text-accent transition hover:underline sm:block"
            >
              All projects →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>

        {/* Recent posts */}
        <section className="border-t border-zinc-200/70 py-16 dark:border-zinc-800/70" aria-labelledby="writing-heading">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 id="writing-heading" className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Latest writing
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                Notes, guides and lessons from building software.{" "}
                <span className="hidden sm:inline">
                  Last updated{" "}
                  {posts[0] ? formatDate(posts[0].date) : ""}
                </span>
              </p>
            </div>
            <Link href="/blog" className="hidden text-sm font-medium text-accent transition hover:underline sm:block">
              All posts →
            </Link>
          </div>
          <div>
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
