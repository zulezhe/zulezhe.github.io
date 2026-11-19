#!/usr/bin/env node
/**
 * Sync blog posts to Blogger.com via the Blogger API v3.
 *
 * Mirrors the pattern of scripts/translate-posts.mjs: content-hash cache,
 * per-slug args, exponential backoff. One Blogger post per (locale, slug);
 * updated source content re-publishes via posts.update.
 *
 * Flow per post:
 *   1. Parse frontmatter + markdown (same rules as lib/posts.ts: skip
 *      `_`-prefixed files and `draft: true`)
 *   2. Render markdown → HTML with the exact pipeline from lib/markdown.ts,
 *      plus one extra step that absolutizes site-relative URLs (images, links)
 *      so assets keep loading from the original site
 *   3. Prepend a localized "first published on" note (the syndication mark)
 *   4. posts.insert (preserving the frontmatter date) or posts.update
 *
 * Interactive posts: the `<!-- interactive:slug -->` marker is swapped for an
 * iframe pointing at the original site's embed page (the ready-made reader
 * bundle for ev-charging-europe, /embed/<slug>/ pages for the other two), so
 * the visualization itself runs inside the Blogger post.
 *
 * Labels: original tags + language tag + a "reprint" tag (see LABELS below).
 *
 * OAuth: pure fetch + node:http loopback flow (no new dependencies).
 *   - Needs .blogger-sync/client-secret.json (OAuth client, type "Desktop app")
 *   - First run opens the browser once; the refresh token is stored in
 *     .blogger-sync/credentials.json (gitignored)
 *
 * Environment:
 *   NEXT_PUBLIC_SITE_URL — production origin (default: CNAME file, else
 *                          https://dyzyzj.top, same chain as lib/site.ts)
 *   NEXT_PUBLIC_BASE_PATH — set when the site is served from a sub path
 *   BLOGGER_BLOG_ID       — target blog id (required when the Google account
 *                           owns several blogs)
 *
 * Usage:
 *   node scripts/sync-to-blogger.mjs                    # all posts, en/de/fr
 *   node scripts/sync-to-blogger.mjs hello-world        # single slug
 *   node scripts/sync-to-blogger.mjs --locale=en        # subset of locales
 *   node scripts/sync-to-blogger.mjs --dry-run          # render preview, no API
 *   node scripts/sync-to-blogger.mjs --force            # re-sync everything
 *   node scripts/sync-to-blogger.mjs --blog=123456      # explicit blog id
 */
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import net from "node:net"
import http from "node:http"
import { spawnSync } from "node:child_process"
import { join, dirname } from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

/**
 * Google API requests go through curl so they can use an HTTP proxy: plain
 * Node fetch does not honor proxy settings, and Google endpoints are not
 * reachable directly from some networks. Override with BLOGGER_PROXY; empty
 * string disables the proxy.
 */
const PROXY = process.env.BLOGGER_PROXY !== undefined
  ? process.env.BLOGGER_PROXY
  : (process.env.HTTPS_PROXY ?? process.env.https_proxy ?? "http://127.0.0.1:7890")

/** Minimal JSON-over-curl transport (status + body text). */
function curlJson({ url, method = "GET", headers = {}, body, maxTime = 60 }) {
  const args = ["-sS", "--max-time", String(maxTime), "-w", "\n%{http_code}", "-X", method, url]
  if (PROXY) args.push("-x", PROXY)
  for (const [k, v] of Object.entries(headers)) args.push("-H", `${k}: ${v}`)
  // curl only reads the request body from stdin when told to (-d @-)
  if (body !== undefined) args.push("--data-binary", "@-")
  const res = spawnSync("curl", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...(body !== undefined ? { input: body } : {}),
  })
  if (res.error) {
    // spawn failure (curl not found…)
    const err = new Error(`curl spawn failed: ${res.error.message}`)
    err.status = 0
    throw err
  }
  if (res.status !== 0) {
    // curl transport failure (DNS, connect, TLS…) — surface as status 0 so retry logic applies
    const err = new Error(`curl failed: ${String(res.stderr).split("\n")[0] || `exit ${res.status}`}`)
    err.status = 0
    throw err
  }
  const m = res.stdout.match(/\n(\d{3})\s*$/)
  return { status: m ? Number(m[1]) : 0, text: m ? res.stdout.slice(0, m.index) : res.stdout }
}
import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeStringify from "rehype-stringify"
import { visit } from "unist-util-visit"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const POSTS_DIR = join(ROOT, "content", "blog")
const STATE_DIR = join(ROOT, ".blogger-sync")
const SECRET_FILE = join(STATE_DIR, "client-secret.json")
const CREDENTIALS_FILE = join(STATE_DIR, "credentials.json")
const CACHE_FILE = join(STATE_DIR, "synced.json")
const PREVIEW_DIR = join(STATE_DIR, "preview")

const BLOGGER_SCOPE = "https://www.googleapis.com/auth/blogger"
const OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
const BLOGGER_API = "https://www.googleapis.com/blogger/v3"

const KNOWN_LOCALES = ["en", "zh-TW", "de", "fr"]

// ── Localized strings (syndication note, interactive fallback, labels) ──────

const FIRST_PUBLISHED = {
  en: (url) => `This article was first published on <a href="${url}">my blog</a>.`,
  "zh-TW": (url) => `本文首發於 <a href="${url}">我的部落格</a>。`,
  de: (url) => `Dieser Artikel wurde zuerst auf <a href="${url}">meinem Blog</a> veröffentlicht.`,
  fr: (url) => `Cet article a d'abord été publié sur <a href="${url}">mon blog</a>.`,
}

const INTERACTIVE_NOTE = {
  en: (url) => `Interactive map — hosted on the original site. If it doesn't load here, <a href="${url}">open it directly</a>.`,
  "zh-TW": (url) => `互動式地圖——託管於原始網站。若無法載入，請<a href="${url}">直接開啟</a>。`,
  de: (url) => `Interaktive Karte – gehostet auf der Original-Website. Falls sie hier nicht lädt, <a href="${url}">öffne sie direkt</a>.`,
  fr: (url) => `Carte interactive — hébergée sur le site d'origine. Si elle ne se charge pas ici, <a href="${url}">ouvrez-la directement</a>.`,
}

/** Where each interactive embed lives on the original site (en edition). */
const INTERACTIVE_EMBED_PATH = {
  "ev-charging-europe": "/interactive/ev-charging-europe/en/",
  "europe-earthquakes-ten-years": "/embed/europe-earthquakes-ten-years/",
  "hk-ev-charging": "/embed/hk-ev-charging/",
}

/** Stand-in text paragraph that survives the markdown pipeline, swapped for
 *  the iframe HTML after rendering. */
const INTERACTIVE_PLACEHOLDER = "BLOGGER-INTERACTIVE-EMBED-PLACEHOLDER"

/** Extra label marking the post as syndicated content (per locale). */
const REPRINT_LABEL = {
  en: "reprint",
  "zh-TW": "轉載",
  de: "zweitveroeffentlichung",
  fr: "republication",
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs() {
  const opts = { locales: ["en", "de", "fr"], blog: process.env.BLOGGER_BLOG_ID || null, dryRun: false, force: false }
  const slugs = []
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--locale=")) {
      opts.locales = arg.slice(9).split(",").map((s) => s.trim()).filter(Boolean)
    } else if (arg.startsWith("--blog=")) {
      opts.blog = arg.slice(7)
    } else if (arg === "--dry-run") {
      opts.dryRun = true
    } else if (arg === "--force") {
      opts.force = true
    } else if (arg.startsWith("--")) {
      console.warn(`Unknown flag ignored: ${arg}`)
    } else {
      slugs.push(arg.replace(/\.md$/i, ""))
    }
  }
  for (const locale of opts.locales) {
    if (!KNOWN_LOCALES.includes(locale)) {
      console.error(`Unknown locale "${locale}". Known: ${KNOWN_LOCALES.join(", ")}`)
      process.exit(1)
    }
  }
  return { ...opts, slugs }
}

// ── Site URL (same chain as lib/site.ts: env → CNAME → fallback) ────────────

function resolveSiteOrigin() {
  let url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "")
  // Same chain as CI (deploy.yml): public/CNAME overrides the fallback domain.
  if (!url && existsSync(join(ROOT, "public", "CNAME"))) {
    url = readFileSync(join(ROOT, "public", "CNAME"), "utf8").trim().replace(/\/+$/, "")
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`
  }
  if (!url) url = "https://dyzyzj.top"
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "")
  return { base: `${url}${basePath}`, display: url }
}

/** Absolute URL of the post on the original site, mirroring localizedPath(). */
function originalPostUrl(base, locale, slug) {
  return locale === "en" ? `${base}/blog/${slug}/` : `${base}/${locale}/blog/${slug}/`
}

// ── Markdown rendering (pipeline copied from lib/markdown.ts) ───────────────

const prettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark" },
  keepBackground: false,
}

/** Same as lib/markdown.ts: add trailing slashes to site-root-relative page links. */
function normalizeInternalLinks() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return
      const href = node.properties?.href
      if (typeof href !== "string") return
      if (!href.startsWith("/") || href.startsWith("//")) return
      if (/\.[a-z0-9]+$/i.test(href)) return
      if (href === "/") return
      if (href.endsWith("/")) return
      node.properties.href = `${href}/`
    })
  }
}

/** Extra step for syndication: absolutize site-relative URLs so images and
 *  internal links keep resolving against the original site from Blogger. */
function absolutizeUrls(base) {
  return (tree) => {
    visit(tree, "element", (node) => {
      for (const prop of ["href", "src", "poster"]) {
        const v = node.properties?.[prop]
        if (typeof v === "string" && v.startsWith("/") && !v.startsWith("//")) {
          node.properties[prop] = base + v
        }
      }
    })
  }
}

async function renderMarkdownForBlogger(source, base) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(normalizeInternalLinks)
    .use(absolutizeUrls, base)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: ["heading-anchor"], ariaHidden: "true", tabIndex: -1 },
      content: { type: "text", value: "#" },
    })
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify)
    .process(source)
  return String(file)
}

// ── Post loading (same skip rules as lib/posts.ts) ──────────────────────────

function loadPost(locale, slug) {
  const file = join(POSTS_DIR, locale === "en" ? `${slug}.md` : join(locale, `${slug}.md`))
  if (!existsSync(file)) return null
  const raw = readFileSync(file, "utf8")
  const { data, content } = matter(raw)
  if (data.draft) return { skip: "draft" }
  const tags = (Array.isArray(data.tags) ? data.tags : [])
    .map((t) => String(t).trim().toLowerCase()).filter(Boolean)
  return {
    title: String(data.title ?? slug),
    date: String(data.date ?? "").slice(0, 10),
    tags,
    content,
    interactive: typeof data.interactive === "string" ? data.interactive : null,
  }
}

/** Swap the interactive embed comment for a plain-text placeholder (raw HTML
 *  would be dropped by the markdown pipeline; the placeholder survives). */
function replaceInteractiveComment(markdown) {
  return markdown.replace(/^<!--\s*interactive:[a-z0-9-]+\s*-->[ \t]*$/im, INTERACTIVE_PLACEHOLDER)
}

// ── Cache ────────────────────────────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(readFileSync(CACHE_FILE, "utf8")) } catch { return {} }
}
function saveCache(cache) {
  mkdirSync(STATE_DIR, { recursive: true })
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n")
}
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16)

// ── OAuth (loopback flow, pure fetch + node:http) ────────────────────────────

function loadClientSecret() {
  if (!existsSync(SECRET_FILE)) {
    console.error(`
Missing ${SECRET_FILE}
One-time setup:
  1. Google Cloud Console → create/select a project
  2. Enable "Blogger API v3"
  3. Create OAuth client ID (type: Desktop app) and download the JSON
  4. Save it as ${SECRET_FILE}`)
    process.exit(1)
  }
  const raw = JSON.parse(readFileSync(SECRET_FILE, "utf8"))
  const c = raw.installed ?? raw.web
  if (!c?.client_id || !c?.client_secret) {
    console.error("client-secret.json does not contain client_id/client_secret")
    process.exit(1)
  }
  return { clientId: c.client_id, clientSecret: c.client_secret }
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
    srv.on("error", reject)
  })
}

function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open"
    : process.platform === "win32" ? "cmd" : "xdg-open"
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url]
  try { spawn(cmd, args, { stdio: "ignore", detached: true }).unref() } catch { /* URL is printed anyway */ }
}

/** Ask Google for tokens via the loopback flow; returns the refresh token. */
async function authorizeLoopback(client) {
  const port = await findFreePort()
  const redirectUri = `http://127.0.0.1:${port}`
  const authUrl = new URL(OAUTH_AUTH_URL)
  authUrl.searchParams.set("client_id", client.clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", BLOGGER_SCOPE)
  // offline + consent ensure a refresh_token is issued even on re-auth
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent")

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, redirectUri)
      const err = u.searchParams.get("error")
      const c = u.searchParams.get("code")
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(`<html><body style="font-family:sans-serif;text-align:center;padding-top:4em">
        <h1>${err || !c ? "❌ Authorization failed" : "✅ Authorization complete"}</h1>
        <p>${err ?? "You can close this tab and return to the terminal."}</p>
      </body></html>`)
      res.on("finish", () => { server.close(); err || !c ? reject(new Error(`OAuth error: ${err}`)) : resolve(c) })
    })
    server.listen(port, "127.0.0.1")
    server.on("error", reject)
    setTimeout(() => { server.close(); reject(new Error("Timed out waiting for Google OAuth redirect (5 min)")) }, 5 * 60_000)

    console.log("\nOpening browser for Google authorization…\n")
    console.log(`  ${authUrl}\n`)
    openBrowser(authUrl.toString())
  })

  const res = await curlJson({
    url: OAUTH_TOKEN_URL,
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  })
  const tokens = JSON.parse(res.text || "{}")
  if (res.status !== 200 || !tokens.refresh_token) {
    const why = tokens.error_description ?? tokens.error ?? res.text.slice(0, 200)
    throw new Error(`Token exchange failed (${res.status}): ${why}. If no refresh_token was issued, revoke the app at https://myaccount.google.com/permissions and retry.`)
  }
  mkdirSync(STATE_DIR, { recursive: true })
  writeFileSync(CREDENTIALS_FILE, JSON.stringify({ refresh_token: tokens.refresh_token }, null, 2) + "\n")
  return tokens.access_token
}

async function refreshAccessToken(client, refreshToken) {
  const res = await curlJson({
    url: OAUTH_TOKEN_URL,
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  })
  const tokens = JSON.parse(res.text || "{}")
  if (res.status !== 200 || !tokens.access_token) {
    const reason = tokens.error_description ?? tokens.error ?? res.status
    throw Object.assign(new Error(`Token refresh failed: ${reason}`), { invalidGrant: reason === "invalid_grant" })
  }
  return tokens.access_token
}

/** Access token for the run; re-authorizes transparently if the grant died. */
async function getAccessToken(client) {
  let refreshToken = null
  try { refreshToken = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf8")).refresh_token } catch {}
  if (!refreshToken) return authorizeLoopback(client)
  try {
    return await refreshAccessToken(client, refreshToken)
  } catch (e) {
    if (!e.invalidGrant) throw e
    console.log("Stored refresh token is no longer valid — re-authorizing…")
    return authorizeLoopback(client)
  }
}

// ── Blogger API client ───────────────────────────────────────────────────────

/** Retryable statuses: Blogger API has known transient 403/limit flakiness. */
const RETRYABLE = new Set([403, 429, 500, 502, 503, 504])

async function bloggerFetch(path, { method = "GET", body, accessToken } = {}, attempt = 1, attempts = 6) {
  let status, text
  try {
    const res = await curlJson({
      url: `${BLOGGER_API}${path}`,
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    status = res.status
    text = res.text
  } catch (e) {
    status = e.status ?? 0
    text = e.message
  }
  if (status >= 200 && status < 300) {
    return text ? JSON.parse(text) : {}
  }
  if (status === 404) {
    const e = new Error("not found")
    e.status = 404
    throw e
  }
  if (RETRYABLE.has(status) && attempt < attempts) {
    // 429 is the per-minute publish quota — a one-minute cooldown works far
    // better than short exponential backoff. 403 on a working auth setup means
    // Blogger's bulk-posting protection kicked in; it lasts tens of minutes,
    // so fail fast after one cooldown retry and let a later run pick up the
    // remaining posts via the cache.
    const giveUp = status === 403 && attempt >= 2
    if (!giveUp) {
      const delay = status === 429 || status === 403 ? 60_000 : 2000 * 2 ** (attempt - 1)
      console.warn(`    retry ${attempt}/${attempts - 1} after ${delay}ms: HTTP ${status}`)
      await new Promise((r) => setTimeout(r, delay))
      return bloggerFetch(path, { method, body, accessToken }, attempt + 1, attempts)
    }
  }
  const detail = text.slice(0, 300).replace(/\s+/g, " ")
  const hint = status === 403
    ? " (check: Blogger API v3 enabled in Google Cloud, correct Google account, blog owned by that account)"
    : ""
  throw new Error(`Blogger API ${status} on ${method} ${path}: ${detail}${hint}`)
}

async function listMyBlogs(accessToken) {
  const data = await bloggerFetch("/users/self/blogs", { accessToken })
  return data.items ?? []
}

async function insertPost(blogId, accessToken, { title, content, labels, published }) {
  return bloggerFetch(`/blogs/${blogId}/posts/`, {
    method: "POST",
    accessToken,
    body: { kind: "blogger#post", title, content, labels, published },
  })
}

async function updatePost(blogId, postId, accessToken, { title, content, labels, published }) {
  return bloggerFetch(`/blogs/${blogId}/posts/${postId}`, {
    method: "PUT",
    accessToken,
    body: { kind: "blogger#post", id: postId, title, content, labels, published },
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Build the Blogger payload for one (locale, slug) ─────────────────────────

async function buildPayload(locale, slug, base, siteDisplay) {
  const post = loadPost(locale, slug)
  if (!post || post.skip) return post
  const originalUrl = originalPostUrl(base, locale, slug)

  const body = replaceInteractiveComment(post.content)
  let html = await renderMarkdownForBlogger(body, base)

  // Interactive posts: swap the placeholder for an iframe of the original
  // site's embed page, so the visualization itself runs inside Blogger.
  if (post.interactive && INTERACTIVE_EMBED_PATH[post.interactive]) {
    const embedUrl = `${base}${INTERACTIVE_EMBED_PATH[post.interactive]}`
    const iframeHtml =
      `<div style="margin:1.5em 0;">` +
      `<iframe src="${embedUrl}" title="Interactive map" loading="lazy" allowfullscreen ` +
      `style="width:100%;height:650px;border:1px solid #e5e7eb;border-radius:8px;background:#ffffff;"></iframe>` +
      `<p style="font-size:0.9em;color:#6b7280;margin:0.5em 0 0;">ℹ️ ${INTERACTIVE_NOTE[locale](embedUrl)}</p>` +
      `</div>`
    const placeholderTag = `<p>${INTERACTIVE_PLACEHOLDER}</p>`
    html = html.includes(placeholderTag)
      ? html.replace(placeholderTag, iframeHtml)
      : html.replace(INTERACTIVE_PLACEHOLDER, iframeHtml) // placeholder rendered in an unexpected wrapper
  }

  const note = FIRST_PUBLISHED[locale](originalUrl)
  const content = `<p><i>${note}</i></p>\n<hr />\n${html}`

  const labels = [...post.tags, locale, REPRINT_LABEL[locale]]
  const published = `${post.date}T00:00:00+00:00`

  // Everything that should trigger a re-sync on change.
  const hashInput = JSON.stringify({ title: post.title, date: post.date, tags: post.tags, base, content })
  const contentHash = hash(hashInput)

  return { title: post.title, content, labels, published, hash: contentHash, originalUrl, siteDisplay }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { slugs, locales, blog, dryRun, force } = parseArgs()
  const { base } = resolveSiteOrigin()

  // Resolve the post list per locale (args apply to every locale).
  const targets = []
  for (const locale of locales) {
    let list = slugs
    if (!list.length) {
      const dir = locale === "en" ? POSTS_DIR : join(POSTS_DIR, locale)
      list = existsSync(dir)
        ? (await import("node:fs")).readdirSync(dir)
            .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
            .map((f) => f.replace(/\.md$/i, ""))
        : []
    }
    for (const slug of list) targets.push({ locale, slug })
  }

  if (!targets.length) {
    console.error("No posts found to sync.")
    process.exit(1)
  }

  // Build all payloads first (dry-run needs no credentials at all).
  const payloadByLocale = { ...locales.reduce((acc, l) => { acc[l] = []; return acc }, {}) }
  for (const { locale, slug } of targets) {
    try {
      const payload = await buildPayload(locale, slug, base)
      if (!payload) { console.log(`  - ${slug} → ${locale}: no source file, skipped`); continue }
      if (payload.skip) { console.log(`  - ${slug} → ${locale}: skipped (${payload.skip})`); continue }
      payloadByLocale[locale].push({ slug, ...payload })
    } catch (e) {
      console.error(`  ✗ ${slug} → ${locale}: build failed: ${String(e).slice(0, 200)}`)
      if (process.env.DEBUG) console.error(e.stack)
      payloadByLocale[locale].push({ slug, failed: true, error: e })
    }
  }

  if (dryRun) {
    console.log(`(dry-run: rendering previews to ${PREVIEW_DIR}, no API calls)\n`)
    let n = 0
    for (const locale of locales) {
      for (const p of payloadByLocale[locale]) {
        if (p.failed) { console.log(`  ✗ ${p.slug} → ${locale}: ${p.error.message}`); continue }
        const dir = join(PREVIEW_DIR, locale)
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, `${p.slug}.html`), p.content)
        console.log(`  · ${p.slug} → ${locale}`)
        console.log(`      title: ${p.title}`)
        console.log(`      published: ${p.published}`)
        console.log(`      labels: ${p.labels.join(", ")}`)
        console.log(`      original: ${p.originalUrl}`)
        n++
      }
    }
    console.log(`\n${n} preview file(s) written. Inspect the HTML, then run without --dry-run to publish.`)
    return
  }

  // Live mode: authenticate, resolve the blog, sync.
  const client = loadClientSecret()
  const accessToken = await getAccessToken(client)

  let blogId = blog
  if (!blogId) {
    const blogs = await listMyBlogs(accessToken)
    if (blogs.length === 1) {
      blogId = blogs[0].id
      console.log(`Syncing to blog "${blogs[0].name}" (${blogs[0].url})`)
    } else if (blogs.length === 0) {
      console.error("This Google account has no Blogger blogs. Create one at https://www.blogger.com/ first.")
      process.exit(1)
    } else {
      console.error("\nThis account owns several blogs — pick one with --blog=<id> or BLOGGER_BLOG_ID:")
      for (const b of blogs) console.error(`  ${b.id}  ${b.name}  ${b.url}`)
      process.exit(1)
    }
  }

  const cache = loadCache()
  let inserted = 0, updated = 0, skipped = 0, failed = 0

  for (const locale of locales) {
    for (const p of payloadByLocale[locale]) {
      const key = `${locale}:${p.slug}`
      if (p.failed) {
        console.error(`  ✗ ${p.slug} → ${locale}: ${p.error.message}`)
        failed++
        continue
      }
      try {
        const entry = typeof cache[key] === "object" && cache[key] !== null ? cache[key] : null
        if (!force && entry?.postId && entry.hash === p.hash) {
          console.log(`  = ${p.slug} → ${locale}: cached, skipped`)
          skipped++
          continue
        }

        let result
        if (entry?.postId) {
          try {
            result = await updatePost(blogId, entry.postId, accessToken, p)
            updated++
            console.log(`  ~ ${p.slug} → ${locale}: updated ${result.url}`)
          } catch (e) {
            if (e.status === 404) {
              console.log(`    post disappeared on Blogger — re-creating`)
              result = await insertPost(blogId, accessToken, p)
              inserted++
              console.log(`  + ${p.slug} → ${locale}: inserted ${result.url}`)
            } else {
              throw e
            }
          }
        } else {
          result = await insertPost(blogId, accessToken, p)
          inserted++
          console.log(`  + ${p.slug} → ${locale}: inserted ${result.url}`)
        }
        cache[key] = { postId: result.id, url: result.url, hash: p.hash, syncedAt: new Date().toISOString() }
        saveCache(cache)
        await sleep(2000) // gentle pacing between write calls
      } catch (e) {
        console.error(`  ✗ ${p.slug} → ${locale}: ${String(e).slice(0, 300)}`)
        failed++
      }
    }
  }

  saveCache(cache)
  console.log(`\nDone: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed.`)
  if (failed) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
