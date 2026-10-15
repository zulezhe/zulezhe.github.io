---
title: "Free Static Site Hosting Compared: Cloudflare Pages vs GitHub Pages vs Vercel vs Netlify"
description: "A 2026 comparison of the four most popular free static hosts — bandwidth, build minutes, speed for overseas visitors, and which one you should actually pick."
date: "2026-09-15"
tags: ["hosting", "static-site", "devops"]
faq:
  - q: "Which free static host is best for visitors outside the US?"
    a: "Cloudflare Pages. Its CDN has the densest global network and the free tier has no bandwidth cap, so pages stay fast for visitors in Asia, Europe and South America alike."
  - q: "Is free static hosting really free forever?"
    a: "For a personal blog, yes. All four providers' free tiers comfortably cover a static site's traffic. The realistic paid triggers are team features, higher build concurrency, or serverless functions at scale — none of which a static blog needs."
  - q: "Do I need a custom domain?"
    a: "No. Every provider gives you a free subdomain (yourname.pages.dev, yourname.github.io, yourname.vercel.app). A custom domain (~$10/year) is worth it for branding and long-term SEO portability, but it's optional."
  - q: "Can I switch hosts later without losing SEO?"
    a: "Yes, if you own your domain — just repoint DNS. If you're on a provider subdomain, set up 301 redirects (supported by Cloudflare and Netlify on free plans) so old URLs keep working."
---

**TL;DR:** For a personal static site targeting a global audience, **Cloudflare Pages** is the strongest default — unlimited free bandwidth and the best worldwide latency. **GitHub Pages** is the simplest if your repo already lives on GitHub. **Vercel** is the smoothest Next.js experience, and **Netlify** lands somewhere in the middle with the most polished preview workflows. All four are genuinely free for a blog like this one.

"Free hosting" used to mean a banner ad at the top of your GeoCities page. Today the free tiers of the big static hosts are, frankly, absurdly good — they exist because a hobbyist today is a startup founder tomorrow. Here's how the four majors compare for a real personal site in 2026.

## The contenders

### Cloudflare Pages

- **Free tier:** unlimited bandwidth, 500 builds/month, unlimited sites
- **Speed:** the whole point — Cloudflare's network peers with essentially every ISP on earth
- **Workflow:** connect a GitHub repo, build command `npm run build`, output directory `out`
- **Catch:** build minutes are shared across your projects; heavy monorepos can hit the cap

**Best for:** sites with a global audience. If your readers are spread across continents, nothing else on this list matches the latency, and the missing bandwidth ceiling means a Hacker News front-page moment costs you nothing.

### GitHub Pages

- **Free tier:** 100GB soft bandwidth/month, 1GB repo size, unlimited public repos
- **Speed:** backed by Fastly's CDN — genuinely fast, just slightly thinner edge coverage than Cloudflare
- **Workflow:** a ready-made GitHub Actions workflow pushes your `out/` folder on every commit
- **Catch:** the 1GB repo limit means large image galleries belong in Git LFS or elsewhere

**Best for:** developer blogs that live next to the code. One platform, one bill (zero), and `username.github.io` is a domain people actually recognize as yours.

### Vercel

- **Free tier:** 100GB bandwidth/month, generous build allowance for personal use
- **Speed:** excellent, with smart edge caching
- **Workflow:** zero-config for Next.js — push and it deploys, previews per PR
- **Catch:** the hobby tier is for non-commercial use; businesses are expected to move to the $20/seat plan

**Best for:** Next.js apps that use server features (ISR, functions, image optimization). For a purely static export it works fine too — you just aren't using most of what Vercel is selling.

### Netlify

- **Free tier:** 100GB bandwidth/month, 300 build minutes
- **Speed:** solid global CDN
- **Workflow:** drag-and-drop deploys, per-PR preview links, lots of little conveniences
- **Catch:** 300 build minutes vanish surprisingly fast if you rebuild on every image commit

**Best for:** people who love the preview-URL workflow or want one-click rollbacks without touching a terminal.

## Head-to-head

|                     | Cloudflare Pages | GitHub Pages | Vercel      | Netlify     |
| ------------------- | ---------------- | ------------ | ----------- | ----------- |
| Free bandwidth      | **Unlimited**    | 100GB/mo     | 100GB/mo    | 100GB/mo    |
| Free builds         | 500/mo           | via Actions  | generous    | 300 min/mo  |
| Global latency      | **Best**         | Great        | Great       | Great       |
| Setup effort        | Low              | Medium       | **Lowest**  | Low         |
| Free subdomain      | .pages.dev       | .github.io   | .vercel.app | .netlify.app|
| Commercial use      | Allowed          | Allowed      | Hobby only  | Allowed     |

## My recommendation

1. **Default choice: Cloudflare Pages.** Unlimited bandwidth plus the widest edge network is hard to argue with for an international audience.
2. **If your site lives beside its code: GitHub Pages.** The Actions workflow is a solved problem and the mental overhead is zero.
3. **If you might grow beyond static: Vercel.** Starting static and adding server features later is a five-line change.

One last note: whichever you choose, put your content in Markdown in a git repo, as this site does. Hosts come and go; a folder of plain-text files is forever.
