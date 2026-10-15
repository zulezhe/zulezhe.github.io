---
title: "This Website"
tagline: "The blog you're reading — a fully static, SEO- and AI-search-optimized personal site that costs $0/month to run."
description: "A fully static personal blog and portfolio built with Next.js static export, optimized for both Google and AI answer engines, hosted for free."
date: "2026-10-12"
tech: ["Next.js", "TypeScript", "Tailwind CSS", "Shiki", "Markdown"]
links:
  repo: "https://github.com/oliver/blog"
featured: true
order: 1
---

## What it is

You're looking at it. A personal blog + portfolio that renders to **plain HTML at build time** — no server, no database, no runtime bill — and still ships the full modern checklist: per-page metadata, build-time Open Graph images, structured data, RSS, sitemap, dark mode, and an `llms.txt` for AI crawlers.

## Why I built it

I wanted a home for writing and projects that I could not outgrow: something fast everywhere in the world, free to run indefinitely, and readable by both humans and the AI assistants people increasingly ask first.

## How it works

- **Content** lives as Markdown files with frontmatter in `content/`. Adding a post is a file commit; the list pages, tag pages, RSS, sitemap and `llms.txt` all regenerate automatically.
- **Build** runs `next build` with `output: 'export'`, producing an `out/` folder of static files.
- **Markdown pipeline** uses remark + rehype with Shiki for dual-theme (light/dark) syntax highlighting, heading anchors, and an auto table of contents.
- **SEO/GEO layer** emits JSON-LD (`WebSite`, `Person`, `BlogPosting`, `BreadcrumbList`, optional `FAQPage`), canonical URLs, and OG images rendered at build time with `next/og`.

## Notes & trade-offs

Static export means no server-side search or analytics — which is a feature as much as a limitation. Search is delegated to engines, comments can be added via giscus (GitHub Discussions), and privacy-friendly Cloudflare Web Analytics slots in with one config value.

Read the full write-up in [How This Site Is Built](/blog/how-this-site-is-built).
