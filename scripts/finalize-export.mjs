/**
 * Post-build fixes for the static export (runs after `next build`).
 *
 * 1. OG images: Next's static export writes `opengraph-image-<hash>` files
 *    (no extension) while the metadata references the un-hashed route path
 *    (`/opengraph-image`, `/blog/<slug>/opengraph-image`, …). On static hosts
 *    the un-hashed path 404s, so every page's og:image / twitter:image is
 *    broken. We copy each hashed image to:
 *      - a stable, extension-correct path under /og/ (referenced by metadata)
 *      - the un-hashed sibling path (covers any Next-generated reference)
 *
 * 2. Trailing-slash redirects: the outer CDN (EdgeOne) resolves `/blog` to
 *    `blog/index.html` and serves it with 200 instead of 301-redirecting to
 *    `/blog/`. That splits every page into two indexable URLs. We emit a
 *    `_redirects` file (Netlify/Cloudflare/EdgeOne Pages syntax) with explicit
 *    301 rules from the non-slash form to the canonical slash form. GitHub
 *    Pages ignores the file; hosts that support it pick it up.
 */
import { mkdir, readdir, copyFile, writeFile, readFile } from "node:fs/promises"
import { existsSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

const out = fileURLToPath(new URL("../out/", import.meta.url))

/** Find the single `opengraph-image-<hash>` file inside a directory. */
function hashedOgImage(dir) {
  if (!existsSync(dir)) return undefined
  const names = readdirSyncSafe(dir)
  return names.find((n) => /^opengraph-image-[0-9a-z]+$/i.test(n))
}

function readdirSyncSafe(dir) {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

// ── 1. OG images ────────────────────────────────────────────────────────────

const ogDir = join(out, "og")
await mkdir(join(ogDir, "blog"), { recursive: true })
await mkdir(join(ogDir, "projects"), { recursive: true })

const rootImage = hashedOgImage(out)
if (rootImage) {
  await copyFile(join(out, rootImage), join(ogDir, "home.png"))
  await copyFile(join(out, rootImage), join(ogDir, "default.png"))
  // Un-hashed sibling for any Next-generated metadata reference.
  await copyFile(join(out, rootImage), join(out, "opengraph-image"))
}

for (const section of ["blog", "projects"]) {
  const sectionDir = join(out, section)
  if (!existsSync(sectionDir)) continue
  for (const slug of readdirSync(sectionDir)) {
    const dir = join(sectionDir, slug)
    const image = hashedOgImage(dir)
    if (!image) continue
    await copyFile(join(dir, image), join(ogDir, section, `${slug}.png`))
    await copyFile(join(dir, image), join(dir, "opengraph-image"))
  }
}
console.log("OG images stabilized under /og/ (+ un-hashed siblings).")

// ── 2. Trailing-slash redirects ─────────────────────────────────────────────

const rules = []
const SKIP = new Set(["_next", "og", "cdn-cgi"])

async function walk(dir, prefix) {
  const entries = await readdir(dir, { withFileTypes: true })
  if (entries.some((e) => e.isFile() && e.name === "index.html")) {
    rules.push(prefix === "" ? "/index.html  /  301" : `${prefix}  ${prefix}/  301`)
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (SKIP.has(entry.name) || entry.name.startsWith(".")) continue
    await walk(join(dir, entry.name), `${prefix}/${entry.name}`)
  }
}
await walk(out, "")

// De-duplicate (a route can only appear once) and sort for stable output.
const unique = [...new Set(rules)].sort()
const redirects = [
  "# 301 every non-trailing-slash page URL to its canonical slash form.",
  "# GitHub Pages ignores this file; EdgeOne/Cloudflare/Netlify Pages honor it.",
  ...unique,
  "",
].join("\n")
await writeFile(join(out, "_redirects"), redirects)
console.log(`_redirects written with ${unique.length} rules.`)

// ── 3. EV report bundle fixes ───────────────────────────────────────────────
//
// The supplied report links to site-root-relative /data/… paths that don't
// exist (the data lives under /interactive/ev-charging-europe/data/) and to
// "/" for "return to interactive map". Crawlers don't run the iframe wrapper's
// click-rewrite script, so those raw hrefs produce the 404s Search Console
// flags. Rewrite them to the real deployed paths in the exported copies.
//
// Also: the raw authoring bundle (dist/index.html) ships with the ask/publish
// UI and no robots meta — it must never be indexed (only the cleaned reader
// is, via the iframe wrapper).

const reportDir = join(out, "interactive/ev-charging-europe/en/analysis-report/dist")
const dataRootPath = "/interactive/ev-charging-europe"
const reportFixes = [
  [/\(\/data\/stations\.csv\)/g, `(${dataRootPath}/data/stations.csv.gz)`],
  [/\(\/data\/summary\.json\)/g, `(${dataRootPath}/data/summary.json)`],
  [/\(\/\)/g, `(${dataRootPath}/en/)`],
]

for (const name of ["index.html", "reader.html"]) {
  const file = join(reportDir, name)
  if (!existsSync(file)) continue
  let html = await readFile(file, "utf8")
  for (const [pattern, replacement] of reportFixes) html = html.replace(pattern, replacement)
  if (name === "index.html" && !/name="robots"/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, '<head$1><meta name="robots" content="noindex,nofollow">')
  }
  await writeFile(file, html)
}
console.log("EV report bundle: data links fixed, raw bundle noindexed.")
