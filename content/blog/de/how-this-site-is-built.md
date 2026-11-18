---
title: "Wie diese Website aufgebaut ist: Ein kostenloser, vollständig statischer Blog mit Next.js"
description: "Der komplette Stack hinter dieser Website — Next.js statischer Export, Markdown-Inhalte, Tailwind CSS und $0 Hosting — plus die genaue Konfiguration, die sie schnell und auffindbar macht."
date: "2026-10-08"
tags: ["nextjs","static-site","webdev"]
featured: true
translationOf: "how-this-site-is-built"
---

**TL;DR:** Dieser Blog ist eine Next.js-App, die zu reinem HTML (`output: 'export'`) exportiert wird. Die Beiträge sind in Markdown geschrieben, mit Tailwind CSS gestylt und auf einem kostenlosen CDN deployed. Kein Server, keine Datenbank, keine monatlichen Kosten. Dieser Beitrag führt durch die Architektur und die wichtigsten Konfigurationsentscheidungen.

Leute fragen mich, warum ein „einfacher Blog" Next.js braucht. Ehrlich gesagt? Er *braucht* es nicht — aber es bringt eine Menge für sehr wenig: dateibasiertes Routing, Rendering zur Build-Zeit, erstklassiges Metadaten-Handling und einen Fluchtweg zu komplexeren Komponenten, falls ich sie jemals brauche. Hier ist der gesamte Stack, von oben bis unten.

## Der Stack

| Ebene     | Entscheidung                          | Warum                                   |
| --------- | ------------------------------------- | --------------------------------------- |
| Framework | Next.js (App Router, Static Export)   | React-DX, kein Laufzeit-Server          |
| Content   | Markdown + Frontmatter in `/content`  | In jedem Editor schreiben, mit git versioniert |
| Styling   | Tailwind CSS v4                       | Schnelle Defaults, einfacher Dark Mode  |
| Rendering | remark/rehype + Shiki                 | GFM, Heading-Anchors, Zwei-Themen-Code  |
| Hosting   | Kostenloser statischer Host (CDN)     | 0 $, globales Edge-Delivery             |

## Statischer Export in einer Zeile

Das Herzstück ist ein einzelnes Config-Flag:
```ts
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",      // build → out/ folder of plain HTML
  trailingSlash: true,   // /blog/index.html URLs, friendly to static hosts
  images: { unoptimized: true }, // no image server needed
}

export default nextConfig
```Mit `output: "export"` gibt `next build` ein vollständig in sich geschlossenes `out/`-Verzeichnis aus. Sie können es auf buchstäblich jeden statischen File-Hoster ziehen. Da die Seiten zur Build-Zeit vorgerendert werden, entspricht der Time-to-First-Byte nur der CDN-Latenz – typischerweise weltweit unter 100 ms.

## Inhalte liegen in Markdown-Dateien

Jeder Beitrag ist eine Datei wie `content/blog/my-post.md`:
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
```Zur Build-Zeit verwandelt eine kleine Pipeline (remark → rehype → Shiki) das Ganze in formatiertes HTML mit Überschriften-Ankern, syntaxhervorgehobenen Codeblöcken, die helle *und* dunkle Themes unterstützen, sowie einem Inhaltsverzeichnis, das aus den Überschriften extrahiert wird.

## SEO ist größtenteils Metadaten-Hygiene

Statisches HTML bringt dich zu 80 % zu gutem SEO. Die restlichen 20 % sind Disziplin:

- Eindeutige `<title>` und Meta-Beschreibungen pro Seite, generiert aus dem Frontmatter.
- Canonical-URLs via `metadataBase`, damit die Seite einen Domain-Umzug übersteht.
- Open-Graph- und Twitter-Card-Bilder, **zur Build-Zeit** mit `next/og` gerendert — kein Image-Service erforderlich.
- `sitemap.xml`, `robots.txt` und ein RSS-Feed, alles aus der Inhaltsliste generiert.
- Strukturierte Daten (JSON-LD) für `WebSite`, `Person`, `BlogPosting` und Breadcrumbs auf jeder Seite.

## Optimierung für KI-Suche obendrauf

Da das HTML statisch und semantisch ist, ist die Seite bereits für LLM-Crawler lesbar. Ich habe zwei kleine Extras hinzugefügt, die nichts kosten:

1. **`llms.txt`** — ein Markdown-Index der gesamten Seite nach der [llmstxt.org](https://llmstxt.org)-Konvention.
2. **`llms-full.txt`** — jeder Artikel als reines Markdown, eine URL, keine Navigations-Elemente.

Das bedeutet: Fragt man einen Chatbot „wie baut man einen kostenlosen statischen Blog", kann er die Antwort direkt aufnehmen. Ich habe eine ausführliche [guide to generative engine optimization](/blog/optimize-content-for-ai-search-engines-geo) geschrieben, falls du die Details möchtest.

## Was es kostet

Nichts. Das Repository ist kostenlos, der Build läuft auf einer kostenlosen CI-Stufe, das CDN ist kostenlos, und die Subdomain ist kostenlos. Das Einzige, was Geld hier *kaufen* könnte, ist eine eigene Domain — schön zu haben, aber nicht erforderlich.

## Fazit

Die gesamte Seite besteht aus ein paar hundert Zeilen TypeScript um einen Ordner mit Markdown-Dateien. Wenn du darüber nachdenkst, einen Blog zu starten, ist das ein ziemlich guter Zeitpunkt: Das Tooling macht „schnell, kostenlos und auffindbar" endlich zum Standard statt zu einem Projekt.
