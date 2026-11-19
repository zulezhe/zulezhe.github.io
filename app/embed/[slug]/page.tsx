import { notFound } from "next/navigation"
import type { Metadata } from "next"
import EarthquakePulse from "@/components/EarthquakePulse"
import HkEvCharging from "@/components/HkEvCharging"
import { siteConfig } from "@/lib/site"

/**
 * Full-bleed pages for embedding interactive post components elsewhere
 * (e.g. Blogger iframes). ev-charging-europe is not listed here — it ships
 * its own prepared bundle at /interactive/ev-charging-europe/en/.
 */
const EMBED_TITLES: Record<string, string> = {
  "europe-earthquakes-ten-years": "Europe's seismic pulse — ten years of earthquakes",
  "hk-ev-charging": "Hong Kong's EV charging network",
}

export function generateStaticParams() {
  return Object.keys(EMBED_TITLES).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const title = EMBED_TITLES[slug]
  return title ? { title, robots: { index: false, follow: true } } : {}
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!EMBED_TITLES[slug]) notFound()
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-4">
      {slug === "europe-earthquakes-ten-years" ? (
        <EarthquakePulse basePath={siteConfig.basePath} locale="en" />
      ) : null}
      {slug === "hk-ev-charging" ? (
        <HkEvCharging basePath={siteConfig.basePath} locale="en" />
      ) : null}
    </main>
  )
}
