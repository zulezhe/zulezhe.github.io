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

## SEO is mostly metadata hygiene

Static HTML gets you 80% of the way to good SEO. The remaining 20% is discipline:

- Unique `<title>` and meta description per page, generated from frontmatter.
- Canonical URLs via `metadataBase`, so the site survives a domain move.
- Open Graph and Twitter card images rendered **at build time** with `next/og` — no image service required.
- `sitemap.xml`, `robots.txt`, and an RSS feed, all generated from the content list.
- Structured data (JSON-LD) for `WebSite`, `Person`, `BlogPosting`, and breadcrumbs on every page.

## Optimizing for AI search on top

Because the HTML is static and semantic, the site is already readable by LLM crawlers. I added two small extras that cost nothing:

1. **`llms.txt`** — a markdown index of the whole site following the [llmstxt.org](https://llmstxt.org) convention.
2. **`llms-full.txt`** — every article in plain markdown, one URL, no navigation chrome.

That means a chatbot asked "how do you build a free static blog" can ingest the answer directly. I wrote a full [guide to generative engine optimization](/blog/optimize-content-for-ai-search-engines-geo) if you want the details.

## What it costs

Nothing. The repo is free, the build runs on a free CI tier, the CDN is free, and the subdomain is free. The only thing money *could* buy here is a custom domain — nice to have, not required.

## Wrap-up

The whole site is a few hundred lines of TypeScript around a folder of Markdown files. If you're thinking about starting a blog, this is a pretty good time: the tooling finally makes "fast, free, and findable" the default instead of a project.
