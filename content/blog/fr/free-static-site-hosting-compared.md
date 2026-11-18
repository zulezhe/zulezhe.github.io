---
title: "Comparatif de l'hébergement gratuit de sites statiques : Cloudflare Pages vs GitHub Pages vs Vercel vs Netlify"
description: "Une comparaison 2026 des quatre hébergeurs statiques gratuits les plus populaires — bande passante, minutes de build, vitesse pour les visiteurs outre-mer, et lequel choisir réellement."
date: "2026-09-15"
tags: ["hosting","static-site","devops"]
faq: [{"q":"Which free static host is best for visitors outside the US?","a":"Cloudflare Pages. Its CDN has the densest global network and the free tier has no bandwidth cap, so pages stay fast for visitors in Asia, Europe and South America alike."},{"q":"Is free static hosting really free forever?","a":"For a personal blog, yes. All four providers' free tiers comfortably cover a static site's traffic. The realistic paid triggers are team features, higher build concurrency, or serverless functions at scale — none of which a static blog needs."},{"q":"Do I need a custom domain?","a":"No. Every provider gives you a free subdomain (yourname.pages.dev, yourname.github.io, yourname.vercel.app). A custom domain (~$10/year) is worth it for branding and long-term SEO portability, but it's optional."},{"q":"Can I switch hosts later without losing SEO?","a":"Yes, if you own your domain — just repoint DNS. If you're on a provider subdomain, set up 301 redirects (supported by Cloudflare and Netlify on free plans) so old URLs keep working."}]
translationOf: "free-static-site-hosting-compared"
---

**TL;DR:** Pour un site statique personnel visant une audience mondiale, **Cloudflare Pages** est le choix par défaut le plus solide — bande passante gratuite illimitée et meilleure latence mondiale. **GitHub Pages** est la solution la plus simple si votre dépôt est déjà sur GitHub. **Vercel** offre l'expérience Next.js la plus fluide, et **Netlify** se situe quelque part entre les deux avec les flux de prévisualisation les plus aboutis. Les quatre sont véritablement gratuits pour un blog comme celui-ci.

« L'hébergement gratuit » signifiait autrefois une bannière publicitaire en haut de votre page GeoCities. Aujourd'hui, les offres gratuites des grands hébergeurs statiques sont, franchement, absurdement bonnes — elles existent parce que l'amateur d'aujourd'hui est le fondateur de startup de demain. Voici comment les quatre grands acteurs se comparent pour un vrai site personnel en 2026.

## Les candidats

### Cloudflare Pages

- **Offre gratuite :** bande passante illimitée, 500 builds/mois, sites illimités
- **Vitesse :** c'est tout l'intérêt — le réseau de Cloudflare est en peering avec pratiquement tous les FAI de la planète
- **Flux de travail :** connectez un dépôt GitHub, commande de build `npm run build`, répertoire de sortie `out`
- **Le hic :** les minutes de build sont partagées entre vos projets ; les monorepos lourds peuvent atteindre la limite

**Idéal pour :** les sites avec une audience mondiale. Si vos lecteurs sont répartis sur plusieurs continents, rien dans cette liste ne rivalise en latence, et l'absence de plafond de bande passante signifie qu'un passage en première page de Hacker News ne vous coûte rien.

### GitHub Pages

- **Offre gratuite :** 100 Go de bande passante (limite souple)/mois, dépôt de 1 Go max, dépôts publics illimités
- **Vitesse :** adossé au CDN de Fastly — vraiment rapide, juste avec une couverture en périphérie légèrement moindre que Cloudflare
- **Flux de travail :** un workflow GitHub Actions prêt à l'emploi pousse votre dossier `out/` à chaque commit
- **Le hic :** la limite de 1 Go par dépôt signifie que les grandes galeries d'images doivent passer par Git LFS ou aller ailleurs

**Idéal pour :** les blogs de développeurs qui vivent à côté du code. Une seule plateforme, une seule facture (zéro), et `username.github.io` est un domaine que les gens reconnaissent réellement comme le vôtre.

### Vercel

- **Offre gratuite :** 100 Go de bande passante/mois, quota de build généreux pour un usage personnel
- **Vitesse :** excellente, avec un cache en périphérie intelligent
- **Flux de travail :** zéro configuration pour Next.js — poussez et c'est déployé, aperçus par PR
- **Le hic :** l'offre hobby est réservée à un usage non commercial ; les entreprises sont invitées à passer au plan à 20 $/siège

**Idéal pour :** les applications Next.js qui utilisent des fonctionnalités serveur (ISR, fonctions, optimisation d'images). Pour un export purement statique, ça fonctionne très bien aussi — vous n'exploitez simplement pas la majeure partie de ce que Vercel vend.

### Netlify

- **Offre gratuite :** 100 Go de bande passante/mois, 300 minutes de build
- **Vitesse :** CDN mondial solide
- **Flux de travail :** déploiements par glisser-déposer, liens d'aperçu par PR, plein de petites commodités
- **Le hic :** 300 minutes de build s'évaporent étonnamment vite si vous rebuildz à chaque commit d'image

**Idéal pour :** ceux qui adorent le flux de travail par URL d'aperçu ou qui veulent des rollbacks en un clic sans toucher à un terminal.

## Comparaison directe

|                     | Cloudflare Pages | GitHub Pages | Vercel      | Netlify     |
| ------------------- | ---------------- | ------------ | ----------- | ----------- |
| Bande passante gratuite | **Illimitée**    | 100 Go/mo     | 100 Go/mo    | 100 Go/mo    |
| Builds gratuits         | 500/mo           | via Actions  | généreux    | 300 min/mo  |
| Latence mondiale        | **Meilleure**         | Excellente        | Excellente       | Excellente       |
| Effort de configuration        | Faible              | Moyen       | **Minimal**  | Faible         |
| Sous-domaine gratuit      | .pages.dev       | .github.io   | .vercel.app | .netlify.app|
| Usage commercial      | Autorisé          | Autorisé      | Hobby seulement  | Autorisé     |

## Ma recommandation

1. **Choix par défaut : Cloudflare Pages.** Bande passante illimitée plus le réseau en périphérie le plus étendu, difficile de faire mieux pour une audience internationale.
2. **Si votre site vit à côté de son code : GitHub Pages.** Le workflow Actions est un problème résolu et la charge mentale est nulle.
3. **Si vous risquez de dépasser le statique : Vercel.** Commencer en statique puis ajouter des fonctionnalités serveur plus tard ne demande que cinq lignes de changement.

Une dernière remarque : quel que soit votre choix, placez votre contenu en Markdown dans un dépôt git, comme le fait ce site. Les hébergeurs vont et viennent ; un dossier de fichiers texte brut, c'est pour toujours.
