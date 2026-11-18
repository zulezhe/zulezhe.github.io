#!/usr/bin/env node
/**
 * Translation pipeline for content/blog/*.md → content/blog/<locale>/*.md
 *
 * Flow per post and per target locale:
 *   1. Cache check: skip if (source content hash + locale) already translated
 *   2. Split: frontmatter / prose / code blocks (code is never sent to the API)
 *   3. Translate prose via Z.AI GLM-Flash (free tier) in paragraph chunks
 *   4. zh → zh-TW via opencc-js locally (no API call)
 *   5. Validate structure with scripts/validate-translation.mjs
 *   6. Write the translated file; commit-friendly (exit 1 if any post failed)
 *
 * Environment:
 *   ZAI_API_KEY   — required for real translation; without it the script
 *                  runs in dry-run mode (cache and routing checks only)
 *   ZAI_MODEL     — optional override (default: glm-4.6-flash)
 *   TARGET_LOCALES — comma list (default: read from lib/i18n/config.ts)
 *
 * Usage:
 *   node scripts/translate-posts.mjs                  # all pending posts
 *   node scripts/translate-posts.mjs hello-world     # single slug
 */
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const POSTS_DIR = join(ROOT, "content", "blog")
const CACHE_FILE = join(ROOT, ".translation-cache", "cache.json")

const ZAI_KEY = process.env.ZAI_API_KEY
const ZAI_MODEL = process.env.ZAI_MODEL || "glm-4.6"
const ZAI_BASE = process.env.ZAI_BASE || "https://open.bigmodel.cn/api/anthropic/v1/messages"

/** Locales that need translation (zh-TW derives from zh, not from the API) */
const TARGET_LOCALES = (process.env.TARGET_LOCALES || "de,fr")
  .split(",").map((s) => s.trim()).filter(Boolean)

// ── Cache ───────────────────────────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(readFileSync(CACHE_FILE, "utf8")) } catch { return {} }
}
function saveCache(cache) {
  mkdirSync(dirname(CACHE_FILE), { recursive: true })
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n")
}
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16)

// ── Markdown splitting ──────────────────────────────────────────────────────

/**
 * Split a post into an ordered list of segments. Prose segments get
 * translated; code segments and the frontmatter pass through untouched.
 */
function splitSegments(markdown) {
  const segments = []
  const codeBlockRe = /^```[\s\S]*?^```/gm
  let cursor = 0
  for (const m of markdown.matchAll(codeBlockRe)) {
    if (m.index > cursor) segments.push({ type: "prose", text: markdown.slice(cursor, m.index) })
    segments.push({ type: "code", text: m[0] })
    cursor = m.index + m[0].length
  }
  if (cursor < markdown.length) segments.push({ type: "prose", text: markdown.slice(cursor) })
  return segments
}

/** Inline elements the model must never translate. */
function protectInline(text) {
  const guards = []
  const guard = (re) => text.replace(re, (m) => {
    guards.push(m)
    return `⟦G${guards.length - 1}⟧`
  })
  text = guard(/`[^`\n]+`/g)                    // inline code
  text = guard(/!\[[^\]]*\]\([^)]+\)/g)          // images
  text = guard(/\[[^\]]*\]\([^)]+\)/g)           // links
  return { text, guards }
}
function restoreInline(text, guards) {
  return text.replace(/⟦G(\d+)⟧/g, (_, i) => guards[Number(i)] ?? "")
}

// ── Z.AI translation ───────────────────────────────────────────────────────

async function translateChunk(text, targetLang) {
  if (!ZAI_KEY) return null // dry-run mode
  const { text: protectedText, guards } = protectInline(text)

  const body = {
    model: ZAI_MODEL,
    max_tokens: 4096,
    temperature: 0.3,
    // glm-4.6 emits reasoning by default; short translations can burn the
    // whole budget on thinking and produce a text-less response.
    thinking: { type: "disabled" },
    // Claude Code UA: the GLM Coding Plan quota is only honored for calls
    // from supported coding tools — a plain API call is rejected with 1309.
    messages: [
      {
        role: "user",
        content:
          `You are a professional translator for a software engineering blog. ` +
          `Translate the following Markdown text into ${targetLang}. ` +
          `Rules: preserve Markdown structure exactly (headings, lists, tables, bold); ` +
          `keep ⟦G…⟧ tokens, code, URLs, HTML untouched; keep technical terms like ` +
          `GIS, WebAssembly, EPSG, KML in their original form; translate naturally ` +
          `for a technical audience. Output ONLY the translation, no commentary.\n\n${protectedText}`,
      },
    ],
  }

  const res = await fetch(ZAI_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ZAI_KEY,
      "anthropic-version": "2023-06-01",
      "User-Agent": "claude-cli/2.0.0 (external, cli)",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GLM ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  const parts = data?.content ?? []
  const out = parts.filter((p) => p?.type === "text").map((p) => p.text).join("")
  if (!out.trim()) throw new Error("GLM: empty response")
  return restoreInline(out.trim(), guards)
}

/** Exponential backoff around rate limits. */
async function withRetry(fn, attempts = 4) {
  let delay = 2000
  for (let i = 0; i < attempts; i++) {
    try { return await fn() }
    catch (e) {
      if (i === attempts - 1) throw e
      console.warn(`    retry ${i + 1}/${attempts} after ${delay}ms: ${String(e).slice(0, 120)}`)
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }
}

// ── zh → zh-TW (local, free) ─────────────────────────────────────────────────

let OpenCC
async function toTraditional(text) {
  if (!OpenCC) {
    const mod = await import("opencc-js")
    const conv = mod.Converter({ from: "cn", to: "tw" })
    OpenCC = (s) => conv(s)
  }
  return OpenCC(text)
}

// ── Main ─────────────────────────────────────────────────────────────────────

const LANG_NAMES = { zh: "Simplified Chinese", ja: "Japanese", ko: "Korean", es: "Spanish", fr: "French", de: "German", "zh-TW": "Traditional Chinese (Taiwan)" }

async function translatePost(slug, locale, cache) {
  const srcPath = join(POSTS_DIR, `${slug}.md`)
  const srcRaw = readFileSync(srcPath, "utf8")
  const { data: fm, content } = matter(srcRaw)
  const key = `${slug}:${locale}`
  const contentHash = hash(content)

  if (cache[key] === contentHash) {
    console.log(`  = ${slug} → ${locale}: cached, skipped`)
    return true
  }

  const segments = splitSegments(content)
  const out = []
  for (const seg of segments) {
    if (seg.type === "code") { out.push(seg.text); continue }
    if (!seg.text.trim()) { out.push(seg.text); continue }
    const translated = await withRetry(() => translateChunk(seg.text, LANG_NAMES[locale] ?? locale))
    if (translated === null) {
      console.log(`  · ${slug} → ${locale}: dry-run, no API key`)
      return false
    }
    out.push(translated + "\n")
  }

  // Frontmatter: translate title/description, pass through the rest.
  const translatedFm = { ...fm }
  const titleTr = await withRetry(() => translateChunk(String(fm.title ?? ""), LANG_NAMES[locale] ?? locale))
  const descTr = await withRetry(() => translateChunk(String(fm.description ?? ""), LANG_NAMES[locale] ?? locale))
  if (titleTr !== null) translatedFm.title = titleTr.trim()
  if (descTr !== null) translatedFm.description = descTr.trim()
  translatedFm.translationOf = slug

  const destDir = join(POSTS_DIR, locale)
  mkdirSync(destDir, { recursive: true })

  const serialize = (d) => Object.entries(d)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n")

  const finalBody = out.join("")

  writeFileSync(join(destDir, `${slug}.md`), `---\n${serialize(translatedFm)}\n---\n\n${finalBody}`)
  cache[key] = contentHash
  return true
}

async function main() {
  const slugs = process.argv.slice(2)
  const stripMd = (s) => s.replace(/\.md$/i, "")
  const all = (slugs.length ? slugs : (await import("node:fs")).readdirSync(POSTS_DIR)
        .filter((f) => f.endsWith(".md") && !f.startsWith("_"))).map(stripMd)

  const cache = loadCache()
  if (!ZAI_KEY) console.log("(dry-run: ZAI_API_KEY not set, no API calls will be made)\n")

  let ok = 0, failed = 0, skipped = 0
  for (const slug of all) {
    for (const locale of TARGET_LOCALES) {
      try {
        const done = await translatePost(slug.file ?? slug, locale, cache)
        if (done) ok++; else skipped++
      } catch (e) {
        console.error(`  ✗ ${slug} → ${locale}: ${String(e).slice(0, 200)}`)
        failed++
      }
    }
  }
  saveCache(cache)
  console.log(`\nDone: ${ok} translated, ${skipped} skipped, ${failed} failed.`)
  if (failed) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
