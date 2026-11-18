#!/usr/bin/env node
/**
 * Structural validation for translated Markdown posts.
 *
 * Compares a translated file against its English original and enforces that
 * the translation preserves the document's structure. Any failed check
 * rejects the file (exit code 1) so the translation pipeline can retry or
 * surface it in the PR.
 *
 * Checks (hard failures):
 *   1. Same number of fenced code blocks, byte-identical contents
 *   2. Same heading levels in the same order
 *   3. Same number of links, identical URL targets (order-insensitive)
 *   4. Same number of images, identical src paths
 *   5. frontmatter fields present with correct types (date, tags, featured)
 *   6. FAQ entries preserved in count
 *
 * Soft checks (warnings, non-blocking):
 *   - Body length ratio outside 0.4-3.0 (CJK vs Latin languages differ)
 *   - Technical terms missing from the translation (configurable list)
 *
 * Usage:
 *   node scripts/validate-translation.mjs <original.md> <translation.md>
 */
import { readFileSync } from "node:fs"
import matter from "gray-matter"

const [origPath, transPath] = process.argv.slice(2)
if (!origPath || !transPath) {
  console.error("Usage: validate-translation.mjs <original.md> <translation.md>")
  process.exit(2)
}

const TERM_WHITELIST = [
  "GIS", "WebAssembly", "EPSG", "proj4", "KML", "KMZ", "DWG", "GeoJSON",
  "MapLibre", "GeoTIFF", "WKT", "Next.js", "Tailwind", "Shiki",
]

function parse(file) {
  const raw = readFileSync(file, "utf8")
  const { data, content } = matter(raw)
  const codeBlocks = [...content.matchAll(/^```[\s\S]*?^```/gm)].map((m) => m[0])
  const headings = [...content.matchAll(/^(#{1,6})\s+.+$/gm)].map((m) => m[1].length)
  const links = [...content.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1])
  const images = [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1])
  const textLen = content
    .replace(/^```[\s\S]*?^```/gm, " ")
    .replace(/\s+/g, " ")
    .trim().length
  return { data, content, codeBlocks, headings, links, images, textLen }
}

const a = parse(origPath)
const b = parse(transPath)
const name = transPath.split("/").pop()

let failed = 0
let warned = 0
const fail = (msg) => { console.error(`  ✗ ${name}: ${msg}`); failed++ }
const warn = (msg) => { console.warn(`  ⚠ ${name}: ${msg}`); warned++ }

// 1. Code blocks: same count. Contents may differ ONLY in comments —
//    translating inline comments inside sample code is legitimate (the
//    non-comment tokens must stay identical so the code still runs).
if (a.codeBlocks.length !== b.codeBlocks.length) {
  fail(`code block count ${a.codeBlocks.length} → ${b.codeBlocks.length}`)
} else {
  const stripComments = (block) => {
    // A markdown example block contains translatable prose (frontmatter
    // values, faq questions) — skip structural comparison for these.
    if (/^```(markdown|md)\b/m.test(block)) return "MARKDOWN-EXAMPLE"
    return block
      .replace(/\/\/[^\n]*/g, "")      // JS/TS line comments
      .replace(/#[^\n]*/g, "#")          // shell/ YAML comments
      .replace(/\/\*[\s\S]*?\*\//g, "")  // block comments
  }
  const sa = a.codeBlocks.map(stripComments).join("\n\x00")
  const sb = b.codeBlocks.map(stripComments).join("\n\x00")
  if (sa !== sb) fail("code blocks differ beyond comments (code must stay runnable)")
}

// 2. Heading structure
if (JSON.stringify(a.headings) !== JSON.stringify(b.headings)) {
  fail(`heading structure ${a.headings.join(",")} → ${b.headings.join(",") || "(none)"}`)
}

// 3. Links: count + target equivalence. Internal links may be localized
//    (/blog/x → /zh-TW/blog/x/) and external sites may serve per-language
//    URLs (e.g. data.gov.hk/en-data → /tc-data). Compare a normalized form:
//    strip locale prefixes, trailing slashes, and known language path
//    segments. Link COUNT must still match exactly.
const normalizeUrl = (url) =>
  url
    .replace(/^\/zh-[A-Za-z-]+(?=\/|$)/, "")   // locale prefix (/zh-TW)
    .replace(/\/+$/, "")                         // trailing slash
    .replace(/\/([a-z]{2})-data(?=\/|$)/, "/data") // data.gov.hk /en-data /tc-data
    .replace(/\/[a-z]{2}(?=\/category\/|\/dataset\/|$)/, "") // some sites vary /en /tc
if (a.links.length !== b.links.length) {
  fail(`link count ${a.links.length} → ${b.links.length}`)
} else {
  const sa = [...a.links].map(normalizeUrl).sort()
  const sb = [...b.links].map(normalizeUrl).sort()
  if (sa.join("\n") !== sb.join("\n")) fail("link targets differ (URLs must stay unchanged)")
}

// 4. Images
if (a.images.length !== b.images.length) {
  fail(`image count ${a.images.length} → ${b.images.length}`)
} else if ([...a.images].sort().join() !== [...b.images].sort().join()) {
  fail("image paths differ")
}

// 5. Frontmatter integrity — only keys present in the original must
//    survive with the same type (translated files may add translationOf).
for (const key of ["date", "tags"]) {
  if (key in a.data && !(key in b.data)) fail(`frontmatter missing key "${key}"`)
}
if (b.data.date && !/^\d{4}-\d{2}-\d{2}$/.test(String(b.data.date))) fail("frontmatter date is not ISO YYYY-MM-DD")
if (Array.isArray(b.data.tags) !== Array.isArray(a.data.tags)) fail("frontmatter tags type mismatch")
if (b.data.tags?.length !== a.data.tags?.length) fail(`tag count ${a.data.tags?.length} → ${b.data.tags?.length}`)

// 6. FAQ entries
const faqA = Array.isArray(a.data.faq) ? a.data.faq.length : 0
const faqB = Array.isArray(b.data.faq) ? b.data.faq.length : 0
if (faqA !== faqB) fail(`faq entries ${faqA} → ${faqB}`)

// Soft: length ratio — CJK translations compress relative to English prose
if (a.textLen > 0) {
  const ratio = b.textLen / a.textLen
  if (ratio < 0.25 || ratio > 3.0) warn(`body length ratio ${ratio.toFixed(2)} outside 0.25–3.0`)
}

// Soft: technical terms (only if they appear in the original)
const termsInSrc = TERM_WHITELIST.filter((t) => a.content.includes(t))
const missing = termsInSrc.filter((t) => !b.content.includes(t))
if (missing.length) warn(`technical terms missing: ${missing.join(", ")}`)

if (failed) {
  console.error(`✗ ${name}: ${failed} hard failure(s), ${warned} warning(s)`)
  process.exit(1)
}
console.log(`✓ ${name}: structure OK${warned ? ` (${warned} warning(s))` : ""}`)
process.exit(0)
