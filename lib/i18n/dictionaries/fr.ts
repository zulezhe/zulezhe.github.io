import type { Dictionary } from "./en"

/**
 * French UI strings. satisfies Dictionary keeps locales structurally identical so a missing key is a type error.
 */
const dict = {
  "nav": {
    "blog": "Blog",
    "projects": "Projets",
    "about": "À propos",
    "ariaLabel": "Navigation principale",
    "skipToContent": "Aller au contenu"
  },
  "home": {
    "kicker": "Bonjour, je m'appelle",
    "heroNote": "J'écris sur le développement web, les outils pour développeurs et la création de sites que Google comme les assistants IA aiment recommander.",
    "viewWork": "Voir mes travaux",
    "readBlog": "Lire le blog",
    "featuredProjects": "Projets en vedette",
    "featuredProjectsNote": "Des choses que j'ai conçues, développées et livrées.",
    "allProjects": "Tous les projets →",
    "latestWriting": "Derniers articles",
    "latestWritingNote": "Notes, guides et leçons tirés de la construction de logiciels.",
    "lastUpdated": "Dernière mise à jour {date}",
    "allPosts": "Tous les articles →"
  },
  "blog": {
    "title": "Blog",
    "metaDescription": "Guides, notes et leçons sur le développement web, Next.js, le SEO, les outils pour développeurs et la réalisation de projets personnels.",
    "countLine": "{count} {count|article|articles} sur la construction pour le web — notes techniques, guides pratiques et quelques opinions de temps en temps.",
    "tagCountLine": "{count} {count|article|articles} étiquetés « {tag} ».",
    "tagIntro": "Tous les articles classés sous ce sujet, du plus récent au plus ancien. {count} {count|article|articles} sur {tag} — écrits à partir de choses réellement construites et livrées.",
    "tagSingleIntro": "Un seul article traite de {tag} pour l'instant. D'autres sur ce sujet arrivent bientôt.",
    "tagRelatedHeading": "Sujets liés",
    "tagMeta": "{count} articles sur {tag} sur ce blog : {titles}. Notes et guides pratiques tirés de choses réellement construites.",
    "tagMetaSingle": "Un article sur {tag} sur ce blog : « {title} ». Un guide pratique basé sur une véritable implémentation.",
    "allPosts": "← Tous les articles"
  },
  "post": {
    "home": "Accueil",
    "blog": "Blog",
    "breadcrumbAria": "Fil d'Ariane",
    "languageAria": "Langue de l'article",
    "updated": "mis à jour",
    "minRead": "{count} min de lecture",
    "faqHeading": "Questions fréquentes",
    "older": "← Plus anciens",
    "newer": "Plus récents →",
    "postNavAria": "Navigation entre les articles",
    "interactiveEarthquakeHeading": "Le pouls sismique de l'Europe, sur un seul mur",
    "interactiveChargingHeading": "Carte interactive et rapport",
    "interactiveHkEvHeading": "La carte des bornes de recharge publiques de Hong Kong"
  },
  "explorer": {
    "searchLabel": "Trouvez quelque chose à lire",
    "searchPlaceholder": "Rechercher des articles, des sujets ou des outils…",
    "sortAria": "Trier les articles",
    "sortNewest": "Plus récents d'abord",
    "sortOldest": "Plus anciens d'abord",
    "sortShortest": "Lectures rapides d'abord",
    "allTopics": "Tous les sujets",
    "filterByTopicAria": "Filtrer par sujet",
    "filterByTagAria": "Filtrer par {tag}",
    "countLine": "{count} {count|article|articles}{inTag}",
    "clearFilters": "Effacer les filtres",
    "noResultsTitle": "Aucun article trouvé",
    "noResultsHint": "Essayez un autre mot-clé ou choisissez un autre sujet.",
    "showAll": "Afficher tous les articles",
    "minRead": "{count} min de lecture",
    "resultArrow": "→"
  },
  "projects": {
    "title": "Projets",
    "metaDescription": "Une sélection de projets et de réalisations perso de {name} — applications web, outils de développement et expériences open-source, avec démos en ligne et code source.",
    "intro": "Une sélection de choses que j'ai construites — des petites expériences aux outils que j'utilise au quotidien. Chaque page de projet contient l'histoire complète, la stack technique et des liens pour l'essayer vous-même.",
    "allProjects": "← Tous les projets",
    "liveDemo": "Démo en ligne ↗",
    "sourceCode": "Code source ↗",
    "techStackAria": "Stack technique",
    "cardReadMore": "En savoir plus →",
    "cardLiveDemo": "Démo en ligne",
    "cardSource": "Source"
  },
  "about": {
    "title": "À propos",
    "metaDescription": "Qui est {name} — un ingénieur logiciel qui construit pour le web. Parcours, compétences et comment me contacter.",
    "heading": "À propos de moi",
    "intro": [
      "Bonjour — je suis {name}, ingénieur logiciel passionné par la transformation d'idées en produits livrés. La majeure partie de mon temps se consacre au développement web : sites statiques rapides, TypeScript propre et outillage qui rend les développeurs plus heureux.",
      "Au cours des dernières années, j'ai travaillé sur des projets frontend et full-stack de toutes tailles — des sites marketing devant se charger instantanément partout dans le monde, aux tableaux de bord internes, en passant par de petits outils open source. Je tiens beaucoup aux fondamentaux, moins glamoureux : la performance, l'accessibilité et le référencement sur les moteurs de recherche.",
      "Loin du clavier, j'aime la lecture, le café et les longues promenades qui ressemblent suspectement à des sessions de débogage."
    ],
    "stackHeading": "Avec quoi je travaille",
    "stack": [
      [
        "Frontend",
        " — TypeScript, React, Next.js, Tailwind CSS"
      ],
      [
        "Backend & outillage",
        " — Node.js, CI/CD, pipelines de sites statiques"
      ],
      [
        "Qualité web",
        " — Core Web Vitals, SEO, données structurées, convivialité pour les crawlers IA (GEO)"
      ]
    ],
    "siteHeading": "Ce site",
    "siteBody": [
      "Ce site web est une génération entièrement statique — pas de serveur, pas de base de données, pas de facture mensuelle. Il est transparent sur son fonctionnement : lisez"
    ],
    "siteBodyLink": "les articles de blog à ce sujet",
    "siteBodyAfter": " si vous voulez construire quelque chose de similaire.",
    "contactHeading": "Me contacter",
    "contactBody": "La meilleure façon de me joindre est l'email — je lis tout et réponds généralement sous quelques jours. Si vous voulez simplement voir ce que je fais, les liens ci-dessous sont là pour ça.",
    "github": "GitHub",
    "twitter": "X / Twitter",
    "email": "M'envoyer un email"
  },
  "notFound": {
    "code": "404",
    "title": "Page introuvable",
    "body": "La page que vous cherchez n'existe pas ou a été déplacée. Ça arrive.",
    "backHome": "Retour à l'accueil",
    "readBlog": "Lire le blog"
  },
  "readingTools": {
    "progressAria": "Progression de la lecture de l'article",
    "comfort": "Installez-vous confortablement",
    "largerText": "Texte plus grand",
    "defaultText": "Texte par défaut",
    "copyLink": "Copier le lien",
    "linkCopied": "Lien copié !",
    "copyFailed": "Impossible de copier. Copiez l'URL depuis votre barre d'adresse.",
    "backToTop": "Retour en haut"
  },
  "toc": {
    "aria": "Table des matières",
    "heading": "Sur cette page"
  },
  "comments": {
    "aria": "Commentaires",
    "heading": "Commentaires"
  },
  "copyCode": {
    "copy": "Copier",
    "copied": "Copié !",
    "failed": "Échec"
  },
  "footer": {
    "rights": "© {year} {name}. Tous droits réservés.",
    "builtWith": "Construit avec Next.js · exporté statiquement · hébergé gratuitement",
    "socialAria": "Liens sociaux"
  },
  "themeToggle": {
    "toLight": "Passer en mode clair",
    "toDark": "Passer en mode sombre"
  },
  "localeSwitcher": {
    "aria": "Changer de langue"
  },
  "tags": {
    "aria": "Étiquettes"
  },
  "earthquake": {
    "loadingKicker": "Chargement du catalogue",
    "loadingTitle": "Tissage de dix années de séismes…",
    "loadingNote": "99 423 événements EMSC, pré-agrégés en une matrice par jour et par zone.",
    "errorTitle": "Les données sismiques interactives n'ont pas pu être chargées.",
    "errorHintBefore": "Essayez les",
    "errorDataLink": "fichiers de données directement",
    "errorHintAfter": ", ou rechargez la page.",
    "kicker": "Interactif · 2016–2025",
    "heading": "Le pouls sismique de l’Europe, en un seul mur",
    "intro": "Une carte de points transforme dix ans de séismes en bruit uniforme. Ce mur conserve le rythme : chaque colonne est un jour, chaque ligne une zone sismique, et chaque marque un événement. Jouez la décennie, faites glisser pour zoomer, ou cliquez sur une zone.",
    "statEvents": "événements M2,5+",
    "statEnergy": "énergie estimée",
    "statRatio": "2023 face aux neuf autres années",
    "statShare": "des événements dans {zone}",
    "viewTabsAria": "Vue interactive",
    "tabWall": "Mur du pouls",
    "tabMap": "Carte de chaleur",
    "mapTitle": "Densité sismique, sur la carte",
    "mapSubtitleByEnergy": "Chaque événement est regroupé dans une cellule de 0,25° et coloré selon l’énergie libérée. Cliquez sur une zone ci-dessous pour l’illuminer.",
    "mapSubtitleByCount": "Chaque événement est regroupé dans une cellule de 0,25° et coloré selon le nombre d’événements. Cliquez sur une zone ci-dessous pour l’illuminer.",
    "mapMeasureAria": "Mesure de la carte",
    "measureEnergy": "Énergie",
    "measureEvents": "Événements",
    "mapTimelineAria": "Chronologie annuelle",
    "mapTimelineModeAria": "Mode chronologie",
    "mapByYear": "Par année",
    "mapCumulative": "Cumulatif",
    "mapDecadeReset": "Décennie entière",
    "mapPlayNote": "Les poids sont calibrés sur le maximum de la décennie — regardez l’Anatolie s’embraser en 2023.",
    "mapNoteEnergy": "Les valeurs faibles se fondent dans l’arrière-plan ; le cadre est le littoral de 38 territoires européens et voisins. L’énergie suit l’approximation log₁₀E = 4,8 + 1,5M.",
    "mapNoteCount": "Les valeurs faibles se fondent dans l’arrière-plan ; le cadre est le littoral de 38 territoires européens et voisins. Les effectifs sont les événements du catalogue de magnitude 2,5 ou plus.",
    "allZones": "Toutes les zones",
    "zoneChipTitle": "{zone} : {count} événements",
    "depthTitle": "Là où la secousse commence",
    "depthSubtitle": "Événements par profondeur. La ligne roumaine présente une seconde population, profonde, autour de 90–160 km.",
    "depthHint": "Cliquez pour cibler cette zone",
    "depthNote": "L’intensité de la couleur est logarithmique. Cliquez sur une ligne pour concentrer le mur du pouls sur cette zone.",
    "ledgerTitle2023": "L’anomalie de 2023",
    "ledgerTitleDefault": "Une décennie d’énergie",
    "ledgerSubtitleEnergy": "{energy} libérées en dix ans. 2023 représente à elle seule {energy2023}, soit environ {ratio}× les neuf autres années réunies.",
    "ledgerSubtitleCount": "{count} événements en dix ans. 2023 a été l’année la plus chargée, mais l’écart est moindre que celui de l’énergie.",
    "exclude2023": "Exclure 2023 de l’échelle",
    "ledgerNoteExcluded": "L’échelle exclut désormais 2023 ({value}). Cliquez sur une barre pour zoomer le mur sur cette année.",
    "ledgerMeasureAria": "Mesure du bilan",
    "ledgerBarsAria": "Totaux de séismes par année",
    "ledgerBarAria": "{year} : {count} événements, {energy}. Cliquez pour zoomer le mur sur cette année.",
    "ledgerNoteEnergy": "L'énergie est l'approximation de Gutenberg–Richter log₁₀E = 4.8 + 1.5M, et non une énergie rayonnée mesurée.",
    "ledgerNoteCount": "Les comptages sont les événements du catalogue EMSC de magnitude 2.5 ou plus. Cliquez sur une barre pour zoomer le mur sur cette année.",
    "wallAria": "Mur pulsé des séismes en Europe. Utilisez les flèches gauche et droite pour avancer d'un jour, maj pour une semaine, alt pour un mois. Appuyez sur Entrée pour lire la décennie.",
    "play": "Lire la décennie",
    "pause": "Pause",
    "hoverEvents": "{count|event|events}",
    "readingSummary": "{count} {events} · plus grand M{mag}",
    "selectedSummary": "{count} événements · plus grand M{mag} · plus profond {depth} km",
    "wallHint": "Faites glisser à gauche ou à droite pour zoomer ; double-cliquez sur le mur pour réinitialiser. {largest}",
    "wallLargest": "L'événement le plus important est M{mag} le {date}.",
    "sourceBefore": "Données : ",
    "sourceAfter": ", catalogue Euro-Méditerranée, 2016–2025, M≥{minMag}, 34–72°N / 25°O–45°E. {events} événements après suppression de {rejected} enregistrements avec une magnitude ou un horodatage inutilisable. L'énergie est dérivée, pas mesurée. Généré le {built}."
  },
  "charging": {
    "heading": "Explorer le réseau de recharge en Europe",
    "description": "La carte et le rapport conservent leurs filtres lorsque vous changez de vue, pour continuer votre exploration.",
    "group": "Vues du réseau de recharge",
    "fullscreen": "Plein écran",
    "open": "Ouvrir séparément ↗",
    "unavailable": "Le plein écran n'est pas disponible. Utilisez plutôt « Ouvrir séparément ».",
    "note": "Les stations et les analyses utilisent des instantanés fixes du projet. Les cartes de fond en ligne nécessitent une connexion ; la carte peut revenir à un contour de pays hors ligne. L'étiquette de la classe de puissance la plus élevée est corrigée en >50 kW.",
    "tablistAria": "Vues du réseau de recharge",
    "views": [
      {
        "id": "map",
        "label": "Carte interactive",
        "hint": "Filtrez par pays, puissance et opérateur. Cliquez sur les clusters ou les stations pour plus de détails ; les chiffres récapitulatifs et les graphiques se mettent à jour selon vos filtres.",
        "title": "Bornes de recharge européennes : carte interactive et filtres"
      },
      {
        "id": "report",
        "label": "Analyse spatiale & rapport",
        "hint": "Changez les métriques des hexagones, faites glisser le curseur des années pour l'Allemagne, ou explorez la galerie détaillée de preuves du rapport avec 23 graphiques.",
        "title": "Réseau de recharge européen : analyse spatiale et rapport interactif"
      }
    ]
  }
} satisfies Dictionary

export default dict
