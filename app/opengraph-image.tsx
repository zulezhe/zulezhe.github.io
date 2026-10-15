import { ImageResponse } from "next/og"
import { siteConfig } from "@/lib/site"

export const dynamic = "force-static"

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
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
              width: 20,
              height: 20,
              borderRadius: 9999,
              backgroundColor: "#3b82f6",
            }}
          />
          <div style={{ fontSize: 30, color: "#a1a1aa", display: "flex" }}>
            {siteConfig.name.toLowerCase()}.com
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 84, fontWeight: 700, display: "flex", letterSpacing: "-0.02em" }}>
            {siteConfig.name}
            <span style={{ color: "#3b82f6" }}>.</span>
          </div>
          <div style={{ fontSize: 38, color: "#a1a1aa", display: "flex", maxWidth: 900 }}>
            {siteConfig.tagline}
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#52525b", display: "flex" }}>
          Projects · Engineering notes · Web dev guides
        </div>
      </div>
    ),
    { ...size },
  )
}
