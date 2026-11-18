import type { MetadataRoute } from "next"
import { absUrl } from "@/lib/site"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Paths that must never be crawled: /lib/ is a WASM-directory example
        // mentioned in a tutorial code block (Google extracts it as a URL and
        // hits a 404); /cdn-cgi/ is Cloudflare's own edge namespace (its email
        // protection rewrite produces crawlable 404 links).
        disallow: ["/lib/", "/cdn-cgi/"],
      },
    ],
    sitemap: absUrl("/sitemap.xml"),
    // No `host:` directive: it is a Yandex-only extension that Googlebot
    // ignores, and Search Console reports it as a warning
    // ("Googlebot 忽略的规则 (line N)").
  }
}
