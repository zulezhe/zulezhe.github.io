import { ImageResponse } from "next/og"
import { getPostBySlug, getAllPosts, formatDate } from "@/lib/posts"
import { siteConfig } from "@/lib/site"

export const dynamic = "force-static"

export const alt = "Blog post cover"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return getAllPosts({ includeDrafts: true }).map((post) => ({ slug: post.slug }))
}

export default async function PostOgImage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const resolved = await params
  const post = getPostBySlug(resolved.slug, true)

  const title = post?.title ?? siteConfig.title
  const date = post ? formatDate(post.date) : ""

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
            {siteConfig.name} · Blog
          </div>
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            display: "flex",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: 980,
          }}
        >
          {title}
        </div>

        <div style={{ fontSize: 26, color: "#71717a", display: "flex" }}>{date}</div>
      </div>
    ),
    { ...size },
  )
}
