import type { Metadata } from "next"
import Link from "next/link"
import { siteConfig, absUrl } from "@/lib/site"
import JsonLd from "@/components/JsonLd"
import { GitHubIcon, MailIcon, XIcon } from "@/components/Icons"

export const metadata: Metadata = {
  title: "About",
  description: `Who ${siteConfig.name} is — a software engineer building for the web. Background, skills, and how to get in touch.`,
  alternates: { canonical: "/about/" },
}

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${siteConfig.name}`,
  url: absUrl("/about/"),
  mainEntity: {
    "@type": "Person",
    name: siteConfig.name,
    description: siteConfig.description,
    jobTitle: "Software Engineer",
    url: absUrl("/"),
    sameAs: [siteConfig.links.github, siteConfig.links.twitter].filter(Boolean),
  },
}

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutJsonLd} />

      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          About me
        </h1>

        <div className="prose prose-zinc mt-8 dark:prose-invert prose-headings:tracking-tight prose-a:font-medium prose-a:text-accent">
          <p>
            Hi — I&apos;m <strong>{siteConfig.name}</strong>, a software engineer who enjoys
            turning ideas into shipped products. Most of my time goes into web development:
            fast static sites, clean TypeScript, and tooling that makes developers happier.
          </p>

          {/* ── EDIT ME: replace the bio below with your own story ── */}
          <p>
            Over the last few years I&apos;ve worked on frontend and full-stack projects of all
            sizes — from marketing sites that need to load instantly anywhere in the world, to
            internal dashboards, to small open-source tools. I care a lot about the boring
            fundamentals: performance, accessibility, and being findable on search engines.
          </p>
          <p>
            Away from the keyboard I like reading, coffee, and long walks that are
            suspiciously shaped like bug-fixing sessions.
          </p>

          <h2>What I work with</h2>
          <ul>
            <li>
              <strong>Frontend</strong> — TypeScript, React, Next.js, Tailwind CSS
            </li>
            <li>
              <strong>Backend &amp; tooling</strong> — Node.js, CI/CD, static site pipelines
            </li>
            <li>
              <strong>Web quality</strong> — Core Web Vitals, SEO, structured data, AI-crawler
              friendliness (GEO)
            </li>
          </ul>

          <h2>This site</h2>
          <p>
            This website is a fully static build — no server, no database, no monthly bill. It&apos;s
            open about how it works: read{" "}
            <Link href="/blog">the blog posts about it</Link> if you want to build something
            similar.
          </p>

          <h2>Get in touch</h2>
          <p>
            The best way to reach me is email — I read everything and usually reply within a
            couple of days. If you just want to see what I&apos;m up to, the links below have
            you covered.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          {siteConfig.links.github ? (
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              <GitHubIcon className="h-4 w-4" /> GitHub
            </a>
          ) : null}
          {siteConfig.links.twitter ? (
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              <XIcon className="h-4 w-4" /> X / Twitter
            </a>
          ) : null}
          {siteConfig.links.email ? (
            <a
              href={siteConfig.links.email}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              <MailIcon className="h-4 w-4" /> Email me
            </a>
          ) : null}
        </div>
      </div>
    </>
  )
}
