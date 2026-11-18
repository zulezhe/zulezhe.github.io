---
title: "Comment ce site est construit : un blog entièrement statique et gratuit avec Next.js"
description: "La stack complète derrière ce site — export statique Next.js, contenu en Markdown, Tailwind CSS et hébergement à 0 $ — ainsi que la configuration exacte qui le rend rapide et facilement trouvable."
date: "2026-10-08"
tags: ["nextjs","static-site","webdev"]
featured: true
translationOf: "how-this-site-is-built"
---

**TL;DR :** Ce blog est une application Next.js exportée en HTML statique (`output: 'export'`), avec des articles rédigés en Markdown, stylés avec Tailwind CSS et déployés sur un CDN gratuit. Pas de serveur, pas de base de données, pas de facture mensuelle. Cet article présente l'architecture et les choix de configuration clés.

On me demande souvent pourquoi un « simple blog » a besoin de Next.js. Honnêtement ? Il n'en a pas *besoin* — mais ça apporte beaucoup pour très peu : le routage basé sur les fichiers, le rendu au moment du build, une gestion des métadonnées de premier ordre, et une porte de sortie vers des composants plus riches si j'en ai envie un jour. Voici toute la stack, de haut en bas.

## La stack

| Couche    | Choix                                 | Pourquoi                                |
| --------- | ------------------------------------- | --------------------------------------- |
| Framework | Next.js (App Router, export statique) | DX React, aucun serveur à l'exécution   |
| Contenu   | Markdown + frontmatter dans `/content` | Écriture dans n'importe quel éditeur, versionné avec git |
| Style     | Tailwind CSS v4                       | Valeurs par défaut rapides, dark mode facile |
| Rendu     | remark/rehype + Shiki                 | GFM, ancres de titres, code bithème     |
| Hébergement | Hébergeur statique gratuit (CDN)    | 0 $, diffusion globale en edge          |

## Export statique en une ligne

Le cœur du système tient en un seul flag de configuration :
```ts
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",      // build → out/ folder of plain HTML
  trailingSlash: true,   // /blog/index.html URLs, friendly to static hosts
  images: { unoptimized: true }, // no image server needed
}

export default nextConfig
```Avec `output: "export"`, `next build` génère un répertoire `out/` totalement autonome. Vous pouvez le déposer sur n'importe quel hébergeur de fichiers statiques. Comme les pages sont pré-générées au moment du build, le time-to-first-byte correspond simplement à la latence du CDN — généralement inférieure à 100 ms partout dans le monde.

## Le contenu réside dans des fichiers Markdown

Chaque article est un fichier comme `content/blog/my-post.md` :
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
```Au moment du build, un petit pipeline (remark → rehype → Shiki) transforme cela en HTML stylé avec des ancres de titres, des blocs de code avec coloration syntaxique prenant en charge les thèmes clair *et* sombre, et une table des matières extraite des titres.

## Le SEO, c'est surtout de l'hygiène des métadonnées

Le HTML statique vous donne 80 % du bon SEO. Les 20 % restants, c'est de la discipline :

- Des `<title>` et méta-descriptions uniques par page, générés à partir du frontmatter.
- Des URLs canoniques via `metadataBase`, pour que le site survive à un changement de domaine.
- Des images Open Graph et Twitter card rendues **au moment du build** avec `next/og` — aucun service d'images requis.
- `sitemap.xml`, `robots.txt` et un flux RSS, tous générés à partir de la liste des contenus.
- Des données structurées (JSON-LD) pour `WebSite`, `Person`, `BlogPosting` et des fils d'Ariane sur chaque page.

## Optimiser pour la recherche IA par-dessus

Comme le HTML est statique et sémantique, le site est déjà lisible par les crawlers de LLM. J'ai ajouté deux petites extras qui ne coûtent rien :

1. **`llms.txt`** — un index markdown de tout le site suivant la convention [llmstxt.org](https://llmstxt.org).
2. **`llms-full.txt`** — chaque article en markdown brut, une URL, sans habillage de navigation.

Cela signifie qu'un chatbot à qui on demande « comment construire un blog statique gratuit » peut ingérer la réponse directement. J'ai écrit un [guide to generative engine optimization](/blog/optimize-content-for-ai-search-engines-geo) complet si vous voulez les détails.

## Ce que ça coûte

Rien. Le dépôt est gratuit, le build tourne sur un niveau CI gratuit, le CDN est gratuit, et le sous-domaine est gratuit. La seule chose que l'argent *pourrait* acheter ici, c'est un domaine personnalisé — agréable à avoir, mais pas indispensable.

## Conclusion

Tout le site tient en quelques centaines de lignes de TypeScript autour d'un dossier de fichiers Markdown. Si vous envisagez de démarrer un blog, c'est le bon moment : les outils font enfin de « rapide, gratuit et trouvable » le réglage par défaut plutôt qu'un projet.
