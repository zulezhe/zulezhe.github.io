import Link from "next/link"
import { siteConfig, absUrl } from "@/lib/site"
import { getDictionary, fmt, localizedPath, type Locale } from "@/lib/i18n"
import JsonLd from "@/components/JsonLd"
import { GitHubIcon, MailIcon, XIcon } from "@/components/Icons"

export default async function AboutContent({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  const path = localizedPath(locale, "/about/")

  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: fmt(t.about.metaDescription, { name: siteConfig.name }),
    url: absUrl(path),
    mainEntity: {
      "@type": "Person",
      name: siteConfig.name,
      description: siteConfig.description,
      jobTitle: "Software Engineer",
      url: absUrl("/"),
      sameAs: [siteConfig.links.github, siteConfig.links.twitter].filter(Boolean),
    },
  }

  return (
    <>
      <JsonLd data={aboutJsonLd} />

      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {t.about.heading}
        </h1>

        <div className="prose prose-zinc mt-8 dark:prose-invert prose-headings:tracking-tight prose-a:font-medium prose-a:text-accent">
          {t.about.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 12)}>{fmt(paragraph, { name: siteConfig.name })}</p>
          ))}

          <h2>{t.about.stackHeading}</h2>
          <ul>
            {t.about.stack.map(([label, rest]) => (
              <li key={label}>
                <strong>{label}</strong>
                {rest}
              </li>
            ))}
          </ul>

          <h2>{t.about.siteHeading}</h2>
          <p>
            {t.about.siteBody[0]}{" "}
            <Link href={localizedPath(locale, "/blog")}>{t.about.siteBodyLink}</Link>
            {t.about.siteBodyAfter}
          </p>

          <h2>{t.about.contactHeading}</h2>
          <p>{t.about.contactBody}</p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          {siteConfig.links.github ? (
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              <GitHubIcon className="h-4 w-4" /> {t.about.github}
            </a>
          ) : null}
          {siteConfig.links.twitter ? (
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              <XIcon className="h-4 w-4" /> {t.about.twitter}
            </a>
          ) : null}
          {siteConfig.links.email ? (
            <a
              href={siteConfig.links.email}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              <MailIcon className="h-4 w-4" /> {t.about.email}
            </a>
          ) : null}
        </div>
      </div>
    </>
  )
}
