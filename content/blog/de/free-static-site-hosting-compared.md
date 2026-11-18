---
title: "Kostenloses Static-Site-Hosting im Vergleich: Cloudflare Pages vs. GitHub Pages vs. Vercel vs. Netlify"
description: "Ein Vergleich aus 2026 der vier beliebtesten kostenlosen Static-Hosts – Bandbreite, Build-Minuten, Geschwindigkeit für Besucher aus Übersee und welcher davon Sie tatsächlich wählen sollten."
date: "2026-09-15"
tags: ["hosting","static-site","devops"]
faq: [{"q":"Which free static host is best for visitors outside the US?","a":"Cloudflare Pages. Its CDN has the densest global network and the free tier has no bandwidth cap, so pages stay fast for visitors in Asia, Europe and South America alike."},{"q":"Is free static hosting really free forever?","a":"For a personal blog, yes. All four providers' free tiers comfortably cover a static site's traffic. The realistic paid triggers are team features, higher build concurrency, or serverless functions at scale — none of which a static blog needs."},{"q":"Do I need a custom domain?","a":"No. Every provider gives you a free subdomain (yourname.pages.dev, yourname.github.io, yourname.vercel.app). A custom domain (~$10/year) is worth it for branding and long-term SEO portability, but it's optional."},{"q":"Can I switch hosts later without losing SEO?","a":"Yes, if you own your domain — just repoint DNS. If you're on a provider subdomain, set up 301 redirects (supported by Cloudflare and Netlify on free plans) so old URLs keep working."}]
translationOf: "free-static-site-hosting-compared"
---

**TL;DR:** Für eine persönliche statische Website mit globalem Publikum ist **Cloudflare Pages** die stärkste Standardwahl — unbegrenzte kostenlose Bandbreite und die beste Latenz weltweit. **GitHub Pages** ist am einfachsten, wenn Ihr Repo bereits auf GitHub liegt. **Vercel** bietet das reibungsloseste Next.js-Erlebnis, und **Netlify** liegt irgendwo dazwischen mit den ausgereiftesten Preview-Workflows. Alle vier sind für einen Blog wie diesen wirklich kostenlos.

„Kostenloses Hosting" bedeutete früher ein Bannerwerbe-Banner oben auf Ihrer GeoCities-Seite. Heute sind die kostenlosen Tarife der großen statischen Hosts, offen gesagt, absurd gut — es gibt sie, weil der Hobbyist von heute der Startup-Gründer von morgen ist. Hier ist ein Vergleich der vier Großen für eine echte persönliche Website im Jahr 2026.

## Die Kandidaten

### Cloudflare Pages

- **Kostenloser Tarif:** unbegrenzte Bandbreite, 500 Builds/Monat, unbegrenzt viele Sites
- **Geschwindigkeit:** der Hauptgrund — Cloudflares Netzwerk ist mit praktisch jedem ISP der Welt direkt verbunden
- **Workflow:** GitHub-Repo verbinden, Build-Befehl `npm run build`, Output-Verzeichnis `out`
- **Haken:** Build-Minuten werden über Ihre Projekte hinweg geteilt; schwergewichtige Monorepos können das Limit erreichen

**Am besten geeignet für:** Sites mit globalem Publikum. Wenn Ihre Leser über Kontinente verteilt sind, erreicht nichts auf dieser Liste die Latenz, und das fehlende Bandbreiten-Limit bedeutet, dass ein Hacker-News-Frontseiten-Moment Sie nichts kostet.

### GitHub Pages

- **Kostenloser Tarif:** 100GB weiche Bandbreitengrenze/Monat, 1GB Repo-Größe, unbegrenzt viele öffentliche Repos
- **Geschwindigkeit:** unterstützt von Fastlys CDN — wirklich schnell, nur etwas dünnere Edge-Abdeckung als Cloudflare
- **Workflow:** ein fertiger GitHub-Actions-Workflow pusht Ihren `out/`-Ordner bei jedem Commit
- **Haken:** das 1GB-Repo-Limit bedeutet, dass große Bildergalerien in Git LFS oder woanders gehören

**Am besten geeignet für:** Entwickler-Blogs, die neben dem Code leben. Eine Plattform, eine Rechnung (null), und `username.github.io` ist eine Domain, die Menschen tatsächlich als Ihre erkennen.

### Vercel

- **Kostenloser Tarif:** 100GB Bandbreite/Monat, großzügige Build-Kontingente für die persönliche Nutzung
- **Geschwindigkeit:** ausgezeichnet, mit intelligentem Edge-Caching
- **Workflow:** Zero-Config für Next.js — pushen und es wird deployed, Previews pro PR
- **Haken:** der Hobby-Tarif ist für nicht-kommerzielle Nutzung gedacht; Unternehmen sollen auf den $20/Seat-Plan wechseln

**Am besten geeignet für:** Next.js-Apps, die Server-Features nutzen (ISR, Functions, Bildoptimierung). Für einen rein statischen Export funktioniert es ebenfalls einwandfrei — Sie nutzen nur nicht das meiste, was Vercel verkauft.

### Netlify

- **Kostenloser Tarif:** 100GB Bandbreite/Monat, 300 Build-Minuten
- **Geschwindigkeit:** solides globales CDN
- **Workflow:** Drag-and-Drop-Deploys, Preview-Links pro PR, viele kleine Annehmlichkeiten
- **Haken:** 300 Build-Minuten sind überraschend schnell verbraucht, wenn Sie bei jedem Bild-Commit neu bauen

**Am besten geeignet für:** Menschen, die den Preview-URL-Workflow lieben oder One-Click-Rollbacks ohne Terminal wollen.

## Direktvergleich

|                     | Cloudflare Pages | GitHub Pages | Vercel      | Netlify     |
| ------------------- | ---------------- | ------------ | ----------- | ----------- |
| Kostenlose Bandbreite | **Unbegrenzt** | 100GB/Mo.    | 100GB/Mo.   | 100GB/Mo.   |
| Kostenlose Builds   | 500/Mo.          | via Actions  | großzügig   | 300 Min./Mo.|
| Globale Latenz      | **Am besten**    | Sehr gut     | Sehr gut    | Sehr gut    |
| Setup-Aufwand       | Gering           | Mittel       | **Am geringsten** | Gering |
| Kostenlose Subdomain | .pages.dev      | .github.io   | .vercel.app | .netlify.app|
| Kommerzielle Nutzung | Erlaubt         | Erlaubt      | Nur Hobby   | Erlaubt     |

## Meine Empfehlung

1. **Standardwahl: Cloudflare Pages.** Unbegrenzte Bandbreite plus das breiteste Edge-Netzwerk ist für ein internationales Publikum schwer zu schlagen.
2. **Wenn Ihre Site neben ihrem Code lebt: GitHub Pages.** Der Actions-Workflow ist ein gelöstes Problem und der mentale Aufwand ist null.
3. **Wenn Sie möglicherweise über statisch hinauswachsen: Vercel.** Statisch zu starten und später Server-Features hinzuzufügen ist eine Änderung über fünf Zeilen.

Ein letzter Hinweis: Für welche Option Sie sich auch entscheiden, legen Sie Ihre Inhalte in Markdown in einem Git-Repo ab, wie diese Site es tut. Hosts kommen und gehen; ein Ordner mit reinen Textdateien bleibt für immer.
