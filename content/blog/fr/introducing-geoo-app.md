---
title: "Présentation de geoo.app : plus de 600 outils GIS gratuits qui s'exécutent entièrement dans votre navigateur"
description: "J'ai construit une boîte à outils SIG basée dans le navigateur — conversion de formats, transformations de coordonnées, traitement de rasters et plus encore — où chaque octet est traité localement avec WebAssembly. Aucune installation, aucun téléversement, aucun compte."
date: "2026-10-15"
tags: ["gis","webassembly","projects"]
featured: true
faq: [{"q":"Is geoo.app really free?","a":"Yes. Every tool is free with no sign-up, no watermarks, and no daily limits. The only ceiling is your device's memory — file size limits exist because of the browser, not a paywall."},{"q":"Do my files get uploaded to a server?","a":"No. All processing runs in your browser via WebAssembly and JavaScript. Files never leave your device, and memory is cleared when you close the tab. That makes it safe for confidential or commercial geospatial data."},{"q":"How large can my files be?","a":"Most formats work up to roughly 500 MB, with zipped Shapefiles supported up to 200 MB. Stream-based parsing keeps the browser responsive even on large files."},{"q":"Which formats and coordinate systems are supported?","a":"Over 30 formats including GeoJSON, Shapefile, KML/KMZ, GPX, CSV, TopoJSON, DXF, DWG, GeoPackage, GeoTIFF and WKT — more than 500 conversion combinations. Coordinates cover WGS84, Web Mercator, every UTM zone, GCJ-02/BD-09, and thousands of CRSs searchable by EPSG code."}]
translationOf: "introducing-geoo-app"
---

**TL;DR :** J'ai développé [geoo.app](https://geoo.app) — une boîte à outils SIG gratuite, accessible depuis le navigateur, avec plus de 600 outils pour la conversion de formats, la transformation de coordonnées, le traitement raster et la visualisation. Tout s'exécute localement via WebAssembly, vos fichiers ne quittent donc jamais votre appareil. Aucune installation, aucun compte, aucun téléversement. Dans cet article : pourquoi je l'ai créé, comment il fonctionne sous le capot, et ce qu'il peut faire pour vous.

## Le problème des outils géospatiaux

Si vous avez déjà travaillé avec des données géographiques, cette histoire vous sera familière.

Vous recevez un `.dwg` d'un client qui doit devenir du GeoJSON. Ou un Shapefile dans un système de coordonnées projeté local qui doit passer en WGS84. La réponse « professionnelle », c'est un logiciel SIG de bureau — puissant, mais coûteux, centré sur Windows, avec 2 Go à télécharger pour ce qui est fondamentalement une conversion de 5 Mo.

La réponse « rapide », c'est l'un des convertisseurs en ligne. Puis vous lisez les petites lignes : votre fichier est téléversé sur le serveur de quelqu'un, traité on-ne-sait-où, et conservé on-ne-sait-combien-de-temps. Pour des données d'arpentage, des limites de clients, ou quoi que ce soit de commercial, ce n'est pas un compromis que vous devriez avoir à faire.

Et la réponse en ligne de commande — GDAL, PROJ, une série d'incantations `ogr2ogr` — est parfaite si vous vivez dans un terminal, mais beaucoup de gens qui travaillent avec des cartes n'en vivent pas, et ne devraient pas avoir à le faire.

Je me suis souvent dit : les navigateurs modernes peuvent compiler et exécuter du C++ à une vitesse proche du natif. La logique de conversion n'est pas la partie difficile — GDAL existe depuis des décennies. Alors pourquoi chaque « convertisseur en ligne » veut-il encore mon fichier ?

Cette question est devenue [geoo.app](https://geoo.app).

## Ce que fait geoo.app

À la base, c'est une suite de plus de 600 outils organisés autour des tâches que les données SIG doivent réellement accomplir :

![geoo.app homepage: 600+ free online GIS tools with local, no-upload processing](/images/geoo-app/home.png)

*La page d'accueil de geoo.app — toute la proposition de valeur en un seul écran : gratuit, illimité, et traitement 100 % local.*

- **Conversion de formats** — plus de 500 combinaisons de conversion parmi 30+ formats : GeoJSON, Shapefile, KML/KMZ, GPX, CSV, TopoJSON, DXF, DWG, GeoPackage, GeoTIFF, WKT et autres. Conversion par lots incluse.
- **Transformation de coordonnées** — WGS84, Web Mercator, toutes les zones UTM, des milliers de systèmes de coordonnées consultables par code EPSG, plus les systèmes chinois GCJ-02 et BD-09, avec traitement par lots.
- **Traitement raster** — conversion de formats, découpage, reprojection et opérations sur les bandes, y compris le travail direct sur GeoTIFF.
- **Visualiseurs et visualisation** — aperçu interactif de vos données sur une carte, sans aucune configuration.
- **Workflow** — enchaînez plusieurs opérations, pour que « convertir → reprojeter → découper » soit un seul flux au lieu de trois allers-retours.
- **Géoréférencement** — ramenez des images non référencées sur des coordonnées du monde réel.
- **Géocodage** — direct et inverse, y compris le géocodage par lots de listes d'adresses CSV (via Nominatim d'OpenStreetMap).

![geoo.app format converter: drag-and-drop panel with GPX, KML, SHP, DWG, DXF, GeoJSON format chips](/images/geoo-app/converter.png)

*Le convertisseur universel — déposez un fichier, choisissez un format cible, et il est traité sur votre machine. Les étiquettes de formats ressemblent à la liste des participants d'un congrès SIG.*

Tout cela est gratuit : sans inscription, sans filigranes, sans limites quotidiennes, sans « les gros fichiers sont une fonctionnalité payante ». L'interface est disponible en 9 langues.

## Comment ça fonctionne : la confidentialité comme architecture

La fonctionnalité phare n'est pas un outil en particulier — c'est que **vos fichiers ne quittent jamais votre appareil**. Pas « nous les supprimons après 24 heures ». Ils ne sont simplement jamais téléversés, parce qu'il n'y a pas de téléversement.

Cela fonctionne parce que le gros du travail s'exécute dans le navigateur :

- **GDAL/OGR compilé en WebAssembly** alimente les moteurs de formats et raster — la même bibliothèque éprouvée qui se cache derrière la plupart des chaînes de traitement SIG de bureau, exécutée localement sur votre machine.
- **L'analyse par flux** gère les gros fichiers (des centaines de mégaoctets) sans figer l'onglet — les données traversent le parseur au lieu d'être chargées en bloc en mémoire.
- **Des bibliothèques géospatiales open source** comblent les lacunes : proj4js et sa base de données de systèmes de coordonnées pour les calculs de coordonnées, shpjs pour la lecture de Shapefile, @tmcw/togeojson pour les formats XML. Je préfère me tenir sur ces épaules plutôt que de réinventer vingt ans de cas particuliers de formats.

Lorsque vous fermez l'onglet, les données disparaissent. Pour quiconque manipule des relevés confidentiels, des limites de clients ou des ensembles de données commerciaux, « vos données restent sur votre appareil » n'est pas une politique de confidentialité — c'est l'architecture.

## Pour qui c'est fait

- **Les professionnels SIG** qui ont besoin d'une conversion rapide sans lancer un logiciel de bureau
- **Les géomètres et consultants** dont les données ne peuvent légalement ou contractuellement pas toucher des serveurs tiers
- **Les développeurs** qui nettoient des données avant de les envoyer vers PostGIS ou une carte web
- **Les étudiants et chercheurs** qui ont besoin de convertir du KML en GeoJSON *tout de suite*, pas après avoir créé un compte

## Essayez-le

Rendez-vous sur [geoo.app](https://geoo.app) — choisissez un outil, déposez un fichier, et regardez-le être traité localement. Si vous travaillez avec des données géographiques, j'aimerais vraiment savoir ce qui manque ; la feuille de route est pilotée presque entièrement par les demandes des utilisateurs. Et si vous êtes curieux de l'aspect site statique de mes projets, jetez un œil à [how this blog is built](/blog/how-this-site-is-built) — les deux forment un joli contraste : l'un pousse tout côté serveur, l'autre pousse tout côté navigateur.
