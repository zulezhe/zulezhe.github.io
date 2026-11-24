/**
 * Submit sitemap URLs to IndexNow so Bing (and Yandex / Seznam / Naver, plus
 * AI engines that consume Bing's index: Copilot, ChatGPT search…) learn about
 * new or changed pages within minutes instead of waiting for a crawl.
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs                 # reads ./out/sitemap.xml
 *   node scripts/submit-indexnow.mjs <sitemap-url>   # fetches a live sitemap
 *
 * The key is read from the single .txt file in public/ (e.g. public/<key>.txt),
 * whose name and content are both the key. That file is copied to the site root
 * at build time, satisfying IndexNow's key-location verification.
 */
import { readFile, readdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const publicDir = fileURLToPath(new URL("../public/", import.meta.url))
const keyFiles = (await readdir(publicDir)).filter((f) => /^[a-z0-9-]{8,128}\.txt$/.test(f))
if (keyFiles.length !== 1) throw new Error(`Expected exactly one IndexNow key file in public/, found ${keyFiles.length}`)
const KEY = keyFiles[0].replace(/\.txt$/, "")

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
