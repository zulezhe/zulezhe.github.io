import type { Dictionary } from "./en"

/**
 * German UI strings. satisfies Dictionary keeps locales structurally identical so a missing key is a type error.
 */
const dict = {
  "nav": {
    "blog": "Blog",
    "projects": "Projekte",
    "about": "Über mich",
    "ariaLabel": "Hauptnavigation",
    "skipToContent": "Zum Inhalt springen"
  },
  "home": {
    "kicker": "Hallo, ich bin",
    "heroNote": "Ich schreibe über Webentwicklung, Entwickler-Tooling und den Aufbau von Websites, die sowohl Google als auch KI-Assistenten gerne empfehlen.",
    "viewWork": "Meine Arbeiten ansehen",
    "readBlog": "Blog lesen",
    "featuredProjects": "Ausgewählte Projekte",
    "featuredProjectsNote": "Dinge, die ich entworfen, gebaut und veröffentlicht habe.",
    "allProjects": "Alle Projekte →",
    "latestWriting": "Neueste Beiträge",
    "latestWritingNote": "Notizen, Anleitungen und Erkenntnisse aus der Softwareentwicklung.",
    "lastUpdated": "Zuletzt aktualisiert am {date}",
    "allPosts": "Alle Beiträge →"
  },
  "blog": {
    "title": "Blog",
    "metaDescription": "Anleitungen, Notizen und Erkenntnisse zu Webentwicklung, Next.js, SEO, Entwickler-Tooling und side projects.",
    "countLine": "{count} {count|Artikel|Artikel} über die Entwicklung für das Web — Engineering-Notizen, praktische Anleitungen und gelegentlich eine eigene Meinung.",
    "tagCountLine": "{count} {count|Artikel|Artikel} mit „{tag}“ markiert.",
    "tagIntro": "Alle Beiträge zu diesem Thema, neueste zuerst. {count} {count|Artikel|Artikel} über {tag} — geschrieben auf Basis tatsächlich gebauter und veröffentlichter Projekte.",
    "tagSingleIntro": "Bisher deckt ein Beitrag {tag} ab. Mehr zu diesem Thema folgt.",
    "tagRelatedHeading": "Verwandte Themen",
    "tagMeta": "{count} Artikel über {tag} in diesem Blog: {titles}. Notizen und praktische Anleitungen aus tatsächlich gebauten Projekten.",
    "tagMetaSingle": "Ein Artikel über {tag} in diesem Blog: „{title}“. Eine praktische Anleitung aus einer echten Implementierung.",
    "allPosts": "← Alle Beiträge"
  },
  "post": {
    "home": "Startseite",
    "blog": "Blog",
    "breadcrumbAria": "Breadcrumb",
    "languageAria": "Artikelsprache",
    "updated": "aktualisiert",
    "minRead": "{count} Min. Lesezeit",
    "faqHeading": "Häufig gestellte Fragen",
    "older": "← Ältere",
    "newer": "Neuere →",
    "postNavAria": "Beitragsnavigation",
    "interactiveEarthquakeHeading": "Europas seismischer Puls, auf einer Wandtafel",
    "interactiveChargingHeading": "Interaktive Karte und Bericht",
    "interactiveHkEvHeading": "Hong Kongs öffentliche Lade-Infrastruktur-Karte"
  },
  "explorer": {
    "searchLabel": "Finde etwas Lesenswertes",
    "searchPlaceholder": "Artikel, Themen oder Tools suchen…",
    "sortAria": "Artikel sortieren",
    "sortNewest": "Neueste zuerst",
    "sortOldest": "Älteste zuerst",
    "sortShortest": "Schnelle Lektüre zuerst",
    "allTopics": "Alle Themen",
    "filterByTopicAria": "Nach Thema filtern",
    "filterByTagAria": "Nach {tag} filtern",
    "countLine": "{count} {count|Artikel|Artikel}{inTag}",
    "clearFilters": "Filter zurücksetzen",
    "noResultsTitle": "Keine Artikel gefunden",
    "noResultsHint": "Versuche ein anderes Stichwort oder wähle ein anderes Thema.",
    "showAll": "Alle Artikel anzeigen",
    "minRead": "{count} Min. Lesezeit",
    "resultArrow": "→"
  },
  "projects": {
    "title": "Projekte",
    "metaDescription": "Ausgewählte Projekte und Nebenbauten von {name} — Web-Apps, Entwickler-Tools und Open-Source-Experimente, mit Live-Demos und Quellcode.",
    "intro": "Eine Auswahl von Dingen, die ich gebaut habe — von kleinen Experimenten bis zu Tools, die ich täglich nutze. Jede Projektseite enthält die ganze Geschichte, den Tech-Stack und Links zum Ausprobieren.",
    "allProjects": "← Alle Projekte",
    "liveDemo": "Live-Demo ↗",
    "sourceCode": "Quellcode ↗",
    "techStackAria": "Tech-Stack",
    "cardReadMore": "Mehr lesen →",
    "cardLiveDemo": "Live-Demo",
    "cardSource": "Quelle"
  },
  "about": {
    "title": "Über mich",
    "metaDescription": "Wer {name} ist — ein Softwareentwickler, der für das Web baut. Hintergrund, Skills und wie man Kontakt aufnimmt.",
    "heading": "Über mich",
    "intro": [
      "Hi — ich bin {name}, ein Softwareingenieur, der es genießt, Ideen in fertige Produkte zu verwandeln. Den Großteil meiner Zeit stecke ich in Webentwicklung: schnelle statische Websites, sauberes TypeScript und Tooling, das Entwickler glücklicher macht.",
      "In den letzten Jahren habe ich an Frontend- und Full-Stack-Projekten aller Größen gearbeitet — von Marketing-Websites, die überall auf der Welt sofort laden müssen, über interne Dashboards bis hin zu kleinen Open-Source-Tools. Mir sind die langweiligen Grundlagen besonders wichtig: Performance, Barrierefreiheit und Auffindbarkeit in Suchmaschinen.",
      "Abseits der Tastatur lese ich gerne, trinke Kaffee und mache lange Spaziergänge, die verdächtig nach Bug-Fixing-Sessions aussehen."
    ],
    "stackHeading": "Womit ich arbeite",
    "stack": [
      [
        "Frontend",
        " — TypeScript, React, Next.js, Tailwind CSS"
      ],
      [
        "Backend & Tooling",
        " — Node.js, CI/CD, Pipelines für statische Websites"
      ],
      [
        "Web-Qualität",
        " — Core Web Vitals, SEO, strukturierte Daten, KI-Crawler-Freundlichkeit (GEO)"
      ]
    ],
    "siteHeading": "Diese Website",
    "siteBody": [
      "Diese Website ist ein vollständig statischer Build — kein Server, keine Datenbank, keine monatliche Rechnung. Sie offenlegt, wie sie funktioniert: Lies"
    ],
    "siteBodyLink": "Blogbeiträge dazu",
    "siteBodyAfter": " wenn du etwas Ähnliches bauen möchtest.",
    "contactHeading": "Kontakt",
    "contactBody": "Am besten erreichst du mich per E-Mail — ich lese alles und antworte normalerweise innerhalb von ein paar Tagen. Wenn du nur sehen willst, woran ich gerade arbeite, helfen dir die Links unten weiter.",
    "github": "GitHub",
    "twitter": "X / Twitter",
    "email": "Schreib mir"
  },
  "notFound": {
    "code": "404",
    "title": "Seite nicht gefunden",
    "body": "Die Seite, die du suchst, existiert nicht oder wurde verschoben. Kommt vor.",
    "backHome": "Zurück zur Startseite",
    "readBlog": "Zum Blog"
  },
  "readingTools": {
    "progressAria": "Lesefortschritt des Artikels",
    "comfort": "Mach es dir bequem",
    "largerText": "Größerer Text",
    "defaultText": "Standardtext",
    "copyLink": "Link kopieren",
    "linkCopied": "Link kopiert!",
    "copyFailed": "Kopieren fehlgeschlagen. Kopiere die URL aus deiner Adressleiste.",
    "backToTop": "Nach oben"
  },
  "toc": {
    "aria": "Inhaltsverzeichnis",
    "heading": "Auf dieser Seite"
  },
  "comments": {
    "aria": "Kommentare",
    "heading": "Kommentare"
  },
  "copyCode": {
    "copy": "Kopieren",
    "copied": "Kopiert!",
    "failed": "Fehler"
  },
  "footer": {
    "rights": "© {year} {name}. Alle Rechte vorbehalten.",
    "builtWith": "Gebaut mit Next.js · statisch exportiert · kostenlos gehostet",
    "socialAria": "Soziale Links"
  },
  "themeToggle": {
    "toLight": "Zum hellen Modus wechseln",
    "toDark": "Zum dunklen Modus wechseln"
  },
  "localeSwitcher": {
    "aria": "Sprache wechseln"
  },
  "tags": {
    "aria": "Tags"
  },
  "earthquake": {
    "loadingKicker": "Katalog wird geladen",
    "loadingTitle": "Zehn Jahre Erdbeben werden verweben…",
    "loadingNote": "99.423 EMSC-Ereignisse, vorab in eine Tag-für-Zone-Matrix aggregiert.",
    "errorTitle": "Die interaktiven Erdbebendaten konnten nicht geladen werden.",
    "errorHintBefore": "Versuche, die",
    "errorDataLink": "Datendateien direkt",
    "errorHintAfter": " oder laden Sie die Seite neu.",
    "kicker": "Interaktiv · 2016–2025",
    "heading": "Europas seismischer Puls auf einer Wand",
    "intro": "Eine Punktekarte verwandelt zehn Jahre Erdbeben in ein gleichförmiges Rauschen. Diese Wand bewahrt den Rhythmus: Jede Spalte ist ein Tag, jede Zeile eine Seismikzone, jede Markierung ein Ereignis. Spielen Sie das Jahrzehnt ab, zoomen Sie per Ziehen oder klicken Sie auf eine Zone.",
    "statEvents": "Ereignisse ab M2,5",
    "statEnergy": "geschätzte Energie",
    "statRatio": "2023 gegenüber den anderen neun Jahren",
    "statShare": "der Ereignisse in {zone}",
    "viewTabsAria": "Interaktive Ansicht",
    "tabWall": "Pulswand",
    "tabMap": "Heatmap",
    "mapTitle": "Seismische Dichte auf der Karte",
    "mapSubtitleByEnergy": "Jedes Ereignis in eine 0,25°-Zelle eingeordnet und nach freigesetzter Energie eingefärbt. Klicken Sie unten auf eine Zone, um sie aufleuchten zu lassen.",
    "mapSubtitleByCount": "Jedes Ereignis in eine 0,25°-Zelle eingeordnet und nach Ereignisanzahl eingefärbt. Klicken Sie unten auf eine Zone, um sie aufleuchten zu lassen.",
    "mapMeasureAria": "Kartenmessgröße",
    "measureEnergy": "Energie",
    "measureEvents": "Ereignisse",
    "mapTimelineAria": "Jahreszeitleiste",
    "mapTimelineModeAria": "Zeitleisten-Modus",
    "mapByYear": "Nach Jahr",
    "mapCumulative": "Kumuliert",
    "mapDecadeReset": "Gesamtes Jahrzehnt",
    "mapPlayNote": "Die Gewichte sind auf das Jahrzehnts-Maximum skaliert — sehen Sie zu, wie Anatolien 2023 aufflammt.",
    "mapNoteEnergy": "Niedrige Werte verschwinden im Hintergrund; der Rahmen ist die Küstenlinie von 38 europäischen und angrenzenden Gebieten. Die Energie folgt der Näherung log₁₀E = 4,8 + 1,5M.",
    "mapNoteCount": "Niedrige Werte verschwinden im Hintergrund; der Rahmen ist die Küstenlinie von 38 europäischen und angrenzenden Gebieten. Die Zählung umfasst Katalogereignisse ab M2,5.",
    "allZones": "Alle Zonen",
    "zoneChipTitle": "{zone}: {count} Ereignisse",
    "depthTitle": "Wo das Beben beginnt",
    "depthSubtitle": "Ereignisse nach Tiefe. Die rumänische Zeile hat eine zweite, tiefe Population bei etwa 90–160 km.",
    "depthHint": "Klicken, um diese Zone zu fokussieren",
    "depthNote": "Die Farbintensität ist logarithmisch. Klicken Sie auf eine Zeile, um die Pulswand auf diese Zone zu fokussieren.",
    "ledgerTitle2023": "Die Anomalie von 2023",
    "ledgerTitleDefault": "Ein Jahrzehnt Energie",
    "ledgerSubtitleEnergy": "{energy} in zehn Jahren freigesetzt. 2023 allein macht {energy2023} aus, etwa {ratio}× die anderen neun Jahre zusammen.",
    "ledgerSubtitleCount": "{count} Ereignisse in zehn Jahren. 2023 war das aktivste Jahr, aber der Abstand ist kleiner als der Energieabstand.",
    "exclude2023": "2023 aus der Skala ausschließen",
    "ledgerNoteExcluded": "Die Skala schließt nun 2023 aus ({value}). Klicken Sie auf einen Balken, um die Wand auf dieses Jahr zu zoomen.",
    "ledgerMeasureAria": "Bilanz-Messgröße",
    "ledgerBarsAria": "Erdbebengesamtwerte nach Jahr",
    "ledgerBarAria": "{year}: {count} Ereignisse, {energy}. Klicken, um die Wand auf dieses Jahr zu zoomen.",
    "ledgerNoteEnergy": "Energie ist die Gutenberg–Richter-Näherung log₁₀E = 4.8 + 1.5M, keine gemessene Strahlungsenergie.",
    "ledgerNoteCount": "Die Zählungen sind EMSC-Katalogereignisse ab M2.5. Klicke auf einen Balken, um die Wand auf dieses Jahr zu zoomen.",
    "wallAria": "Europa-Erdbeben-Pulswand. Nutze die Pfeiltasten links und rechts, um sich tageweise zu bewegen, mit Umschalttaste wochenweise, mit Alttaste monatsweise. Drücke Enter, um das Jahrzehnt abzuspielen.",
    "play": "Das Jahrzehnt abspielen",
    "pause": "Pause",
    "hoverEvents": "{count|event|events}",
    "readingSummary": "{count} {events} · größtes M{mag}",
    "selectedSummary": "{count} Ereignisse · größtes M{mag} · tiefstes {depth} km",
    "wallHint": "Ziehe nach links oder rechts, um zu zoomen; doppelklicke die Wand, um zurückzusetzen. {largest}",
    "wallLargest": "Das größte Ereignis ist M{mag} am {date}.",
    "sourceBefore": "Daten: ",
    "sourceAfter": ", Euro-Mediterraner Katalog, 2016–2025, M≥{minMag}, 34–72°N / 25°W–45°E. {events} Ereignisse nach dem Entfernen von {rejected} Datensätzen mit unbrauchbarer Magnitude oder Zeitstempel. Energie ist abgeleitet, nicht gemessen. Erstellt am {built}."
  },
  "charging": {
    "heading": "Entdecke Europas Ladeinfrastruktur",
    "description": "Karte und Bericht behalten ihre Filter beim Wechseln der Ansicht, sodass du weitersuchen kannst.",
    "group": "Ladeinfrastruktur-Ansichten",
    "fullscreen": "Vollbild",
    "open": "Separat öffnen ↗",
    "unavailable": "Vollbild ist nicht verfügbar. Nutze stattdessen „Separat öffnen“.",
    "note": "Stationen und Analysen verwenden feste Projekt-Snapshots. Online-Basiskarten benötigen eine Verbindung; die Karte kann auf eine Offline-Länderumriss zurückfallen. Die Beschriftung der höchsten Leistungsklasse ist korrigiert auf >50 kW.",
    "tablistAria": "Ladeinfrastruktur-Ansichten",
    "views": [
      {
        "id": "map",
        "label": "Interaktive Karte",
        "hint": "Filtere nach Land, Leistung und Betreiber. Klicke auf Cluster oder Stationen für Details; Übersichtszahlen und Diagramme aktualisieren sich mit deinen Filtern.",
        "title": "Europäische Ladestationen: interaktive Karte und Filter"
      },
      {
        "id": "report",
        "label": "Räumliche Analyse & Bericht",
        "hint": "Wechsle die Hexagon-Metriken, ziehe den Jahres-Slider für Deutschland oder öffne die detaillierte Galerie mit 23 Diagrammen im Bericht.",
        "title": "Europäisches Ladenetz: räumliche Analyse und interaktiver Bericht"
      }
    ]
  }
} satisfies Dictionary

export default dict
