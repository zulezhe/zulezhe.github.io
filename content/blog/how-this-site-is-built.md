---
title: "How This Site Is Built: A Free, Fully Static Blog with Next.js"
description: "The complete stack behind this website — Next.js static export, Markdown content, Tailwind CSS, and $0 hosting — plus the exact configuration that makes it fast and findable."
date: "2026-10-08"
tags: ["nextjs", "static-site", "webdev"]
featured: true
---

**TL;DR:** This blog is a Next.js app exported to plain HTML (`output: 'export'`), with posts written in Markdown, styled with Tailwind CSS, and deployed to a free CDN. No server, no database, no monthly bill. This post walks through the architecture and the key configuration choices.

People ask why a "simple blog" needs Next.js. Honestly? It doesn't *need* it — but it buys a lot for very little: file-based routing, build-time rendering, first-class metadata handling, and an escape hatch to richer components if I ever want them. Here's the whole stack, top to bottom.

## The stack

| Layer     | Choice                                | Why                                     |
| --------- | ------------------------------------- | --------------------------------------- |
| Framework | Next.js (App Router, static export)   | React DX, zero runtime server           |
| Content   | Markdown + frontmatter in `/content`  | Write in any editor, versioned with git |
| Styling   | Tailwind CSS v4                       | Fast defaults, easy dark mode           |
| Rendering | remark/rehype + Shiki                 | GFM, heading anchors, dual-theme code   |
| Hosting   | Free static host (CDN)                | $0, global edge delivery                |

## Static export in one line

The heart of it is a single config flag:

```ts
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",      // build → out/ folder of plain HTML
  trailingSlash: true,   // /blog/index.html URLs, friendly to static hosts
  images: { unoptimized: true }, // no image server needed
}

export default nextConfig
```

With `output: "export"`, `next build` emits a fully self-contained `out/` directory. You can drag it onto literally any static file host. Because pages are pre-rendered at build time, time-to-first-byte is just CDN latency — typically under 100ms worldwide.

## Content lives in Markdown files

Every post is a file like `content/blog/my-post.md`:

```markdown
---
title: "My Post"
description: "What the reader gets out of it."
date: "2026-10-08"
tags: ["nextjs"]
faq:
  - q: "A question readers ask?"
    a: "The short answer, also emitted as FAQ structured data."
---

**TL;DR:** The one-paragraph version for skimmers and AI answer engines.
```

At build time a small pipeline (remark → rehype → Shiki) turns that into styled HTML with heading anchors, syntax-highlighted code blocks that support light *and* dark themes, and a table of contents extracted from the headings.

### Why files beat a CMS here

A content management system would solve problems I do not have. I am the only author, posts change rarely, and the "editor" I want is the one already open in my terminal. Plain Markdown gives me three things a database never will: a complete history of every edit through git, the ability to write offline, and a content folder I can copy to a new framework in an afternoon if Next.js falls out of favour. Frontmatter doubles as structured input — the FAQ blocks, tags and description fields are read directly by the metadata and JSON-LD generators, so there is no second place to keep in sync. The trade-off is real: there is no WYSIWYG preview, and a typo in YAML can break a build. For a one-person blog that is a fair price.

### What a build actually does

`npm run build` is less mysterious than it looks. It reads every `.md` file under `content/`, parses frontmatter, renders the body through the remark/rehype chain, generates static OG images, then writes an `out/` directory containing one `index.html` per route. A finalisation script walks that directory, emits `_redirects` for every trailing-slash variant, and copies the feeds and text indexes. The whole run finishes in well under a minute on a free CI tier. Because the output is just files, a rollback is a matter of pointing the CDN at the previous deployment — there is no migration to undo and no cache layer to invalidate by hand.

## SEO is mostly metadata hygiene

Static HTML gets you 80% of the way to good SEO. The remaining 20% is discipline:

- Unique `<title>` and meta description per page, generated from frontmatter.
- Canonical URLs via `metadataBase`, so the site survives a domain move.
- Open Graph and Twitter card images rendered **at build time** with `next/og` — no image service required.
- `sitemap.xml`, `robots.txt`, and an RSS feed, all generated from the content list.
- Structured data (JSON-LD) for `WebSite`, `Person`, `BlogPosting`, and breadcrumbs on every page.

### The traps worth knowing about

Three details caused me more trouble than the rest of the build combined. First, trailing slashes: a static host will happily serve the same page at `/post` and `/post/`, and unless you redirect one version Google may pick the wrong one as canonical. `trailingSlash: true` plus explicit 301 rules keeps a single answer. Second, tag archives: an archive with one post is thin content by any reasonable definition, so those pages now carry `noindex, follow` and are left out of the sitemap while still being useful for navigation. Third, redirects only work where the host actually reads them — a generated `_redirects` file is meaningless on a platform that expects a different config format. None of this is framework-specific; it is the kind of bookkeeping static sites trade for their speed.

## Optimizing for AI search on top

Because the HTML is static and semantic, the site is already readable by LLM crawlers. I added two small extras that cost nothing:

1. **`llms.txt`** — a markdown index of the whole site following the [llmstxt.org](https://llmstxt.org) convention.
2. **`llms-full.txt`** — every article in plain markdown, one URL, no navigation chrome.

That means a chatbot asked "how do you build a free static blog" can ingest the answer directly. I wrote a full [guide to generative engine optimization](/blog/optimize-content-for-ai-search-engines-geo) if you want the details.

## What it costs

Nothing. The repo is free, the build runs on a free CI tier, the CDN is free, and the subdomain is free. The only thing money *could* buy here is a custom domain — nice to have, not required.

## Wrap-up

The whole site is a few hundred lines of TypeScript around a folder of Markdown files. If you're thinking about starting a blog, this is a pretty good time: the tooling finally makes "fast, free, and findable" the default instead of a project.
