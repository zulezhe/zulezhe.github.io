---
title: "GEO: How to Optimize Your Content for AI Search Engines"
description: "A practical guide to Generative Engine Optimization — making your site the source that ChatGPT, Perplexity and Claude quote, with concrete tactics you can apply today."
date: "2026-09-28"
tags: ["seo", "geo", "content"]
featured: true
faq:
  - q: "What is GEO in SEO?"
    a: "GEO (Generative Engine Optimization) is the practice of making your content easy for AI answer engines — ChatGPT Search, Perplexity, Google AI Overviews, Claude — to find, trust, and cite. It complements classic SEO rather than replacing it."
  - q: "Is GEO replacing traditional SEO?"
    a: "No. Most AI engines still crawl and rank the open web using signals similar to classic SEO (crawlability, authority, freshness). GEO is the layer on top: structure and phrasing that make your content quotable inside generated answers."
  - q: "What is llms.txt?"
    a: "llms.txt is an emerging convention (llmstxt.org): a markdown file at your site root that indexes your content for LLM crawlers — like robots.txt, but written for AI assistants instead of search spiders."
  - q: "How do I measure GEO results?"
    a: "Watch your referral logs for AI crawlers (GPTBot, ClaudeBot, PerplexityBot), track branded search lift, and periodically ask the major assistants questions in your niche to see whether — and how — you get cited."
---

**TL;DR:** More and more discovery happens inside AI answers, not the "10 blue links." The good news: the fundamentals that make content quotable to a language model are the same ones that make it useful to humans — clear structure, quotable statements, real expertise, and clean machine-readable markup. Here's the playbook.

Somewhere in the last couple of years, "searching" quietly became "asking." Before I buy a library, plan a trip, or pick a hosting provider, I increasingly ask ChatGPT or Perplexity first — and so does everyone else I know. If a chatbot summarizes your niche and your name isn't in the answer, you don't exist.

That's the problem **Generative Engine Optimization (GEO)** tries to solve. It's younger than SEO and the rules are still settling, but the direction is clear. Here's what actually seems to matter, based on what the engines expose and what gets cited in practice.

## 1. Be crawlable by AI bots, on purpose

AI assistants use their own crawlers with their own user agents — `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, and friends. Two implications:

- Check your `robots.txt` and CDN firewall rules. Some security defaults and "anti-AI" plugins block these bots outright. That's a legitimate choice — but make it deliberately.
- Serve content as **static, semantic HTML**. An SPA that renders through client-side JavaScript is a black box to a crawler that doesn't execute JS. Static HTML with real headings, lists, and tables is trivially parseable. (This blog is fully static for exactly this reason.)

## 2. Structure content so it's quotable

Language models answer by *extracting and condensing*. Make extraction easy:

- **Lead with the answer.** Put a one-paragraph TL;DR at the top of every long post. If a model only keeps one chunk, make sure it's the chunk that answers the question.
- **Use descriptive headings phrased as questions or claims.** "How to set up a canonical URL in Next.js" beats "Configuration."
- **Write self-contained paragraphs.** A sentence that only makes sense with the previous three sentences won't survive being quoted alone.
- **Use lists and tables for enumerable facts.** Models extract structured data more faithfully than flowing prose.
- **Add an FAQ section for real questions.** Question-and-answer format maps directly onto how people prompt assistants — and it doubles as `FAQPage` structured data.

## 3. Give machines structured metadata

Structured data helps classic search *and* gives language models reliable facts to anchor on:

- `Person` and `WebSite` JSON-LD on the homepage — who you are, what the site is.
- `BlogPosting` on articles with visible publish/update dates, author, and word count.
- `BreadcrumbList` so hierarchy is unambiguous.
- Dates **rendered in the visible content** too, not just in meta tags — models trust what they can read.

## 4. Publish an llms.txt

The [llms.txt convention](https://llmstxt.org) is exactly what it sounds like: a markdown file at your root that tells LLM crawlers what's on the site, section by section, link by link. It costs an afternoon to generate and this is what mine looks like conceptually:

```markdown
# Oliver — Software Engineer & Writer

> Projects, engineering notes and web dev guides.

## Articles
- [Free static hosting compared](/blog/...): Cloudflare Pages vs
  GitHub Pages vs Vercel vs Netlify, with free-tier limits.
- [How this site is built](/blog/...): Next.js static export stack.
```

A companion `llms-full.txt` with the complete markdown of every article lets a bot ingest the whole site in one request. Whether engines use these files yet varies — but there's no downside to being legible.

## 5. Earn citations the old-fashioned way

The uncomfortable truth: AI engines cite *sources with authority*, and authority still comes from the boring stuff — original information, working demos, real names and dates, links from other sites people trust. A personal site that publishes specific, verifiable, first-hand content ("I measured X, here's the repo") gets quoted far more than generic listicles. Expertise is the moat; formatting just makes it machine-readable.

## How to know it's working

Practical signals, in increasing order of effort:

1. **Crawler logs.** Look for GPTBot / ClaudeBot / PerplexityBot hits in your analytics or server logs.
2. **Branded search lift.** More people searching your site's name usually means more people saw it cited somewhere.
3. **Ask the engines.** Periodically query ChatGPT and Perplexity with questions in your niche and see if you show up in sources. Unscientific, but humbling and informative.

## Start this week

If you want a prioritized short list: fix your `robots.txt` for AI bots, add TL;DRs and FAQs to your ten most important pages, emit correct JSON-LD, publish `llms.txt`, and keep writing specific first-hand content. That's 90% of GEO today — and it happens to be good writing advice anyway.
