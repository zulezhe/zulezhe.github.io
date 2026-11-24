/**
 * Submit sitemap URLs to IndexNow so Bing (and Yandex / Seznam / Naver, plus
 * AI engines that consume Bing's index: Copilot, ChatGPT search…) learn about
 * new or changed pages within minutes instead of waiting for a crawl.
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs                 # reads ./out/sitemap.xml
 *   node scripts/submit-indexnow.mjs <sitemap-url>   # fetches a live sitemap
 *
 * The key file must be publicly reachable at https://<host>/<key>.txt and its
 * content must equal the key. See public/<key>.txt.
 */
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const KEY = "470addb5b7bd4ed19317d3620b26a989."
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dyzyzj.top").replace(/\/+$/, "")
const HOST = new URL(SITE_URL).hostname
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`
const ENDPOINT = "https://api.indexnow.org/indexnow"

const source = process.argv[2] ?? fileURLToPath(new URL("../out/sitemap.xml", import.meta.url))

let xml
if (/^https?:\/\//.test(source)) {
  const res = await fetch(source)
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status} ${res.statusText}`)
  xml = await res.text()
} else {
  xml = await readFile(source, "utf8")
}

const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1])
if (urls.length === 0) throw new Error("No URLs found in sitemap")

// IndexNow accepts at most 10,000 URLs per call.
const batchSize = 10000
for (let i = 0; i < urls.length; i += batchSize) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls.slice(i, i + batchSize),
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  console.log(`[IndexNow] batch ${i / batchSize + 1}: ${res.status} ${res.statusText} ${text}`)
  if (!res.ok) throw new Error(`IndexNow rejected batch: ${res.status} ${text}`)
}
console.log(`[IndexNow] submitted ${urls.length} URLs from ${source}`)
