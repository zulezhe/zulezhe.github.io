import type { MetadataRoute } from "next"
import { absUrl } from "@/lib/site"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: absUrl("/sitemap.xml"),
    host: siteHost(),
  }
}

function siteHost(): string | undefined {
  try {
    return new URL(`${absUrl("/")}`).host
  } catch {
    return undefined
  }
}
