import { ImageResponse } from "next/og"
import { getAllProjects, getProjectBySlug } from "@/lib/projects"
import { siteConfig } from "@/lib/site"

export const dynamic = "force-static"

export const alt = "Project cover"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return getAllProjects({ includeDrafts: true }).map((project) => ({ slug: project.slug }))
}

export default async function ProjectOgImage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const resolved = await params
  const project = getProjectBySlug(resolved.slug, true)

  const title = project?.title ?? siteConfig.title
  const tagline = project?.tagline ?? siteConfig.tagline

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 90px",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 9999,
              backgroundColor: "#3b82f6",
            }}
          />
          <div style={{ fontSize: 28, color: "#a1a1aa", display: "flex" }}>
            {siteConfig.name} · Projects
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              display: "flex",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 32, color: "#a1a1aa", display: "flex", maxWidth: 900 }}>
            {tagline}
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#52525b", display: "flex" }}>
          {project?.tech.join(" · ") ?? ""}
        </div>
      </div>
    ),
    { ...size },
  )
}
