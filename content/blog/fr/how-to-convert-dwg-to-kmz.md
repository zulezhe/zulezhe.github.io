---
title: "Comment convertir un fichier DWG en KMZ — gratuitement, directement dans votre navigateur"
description: "Un guide pas à pas pour convertir des dessins AutoCAD DWG en fichiers KMZ Google Earth à l'aide de geoo.app — sans installation de logiciel, sans compte et sans téléversement de fichiers. Inclut les pièges des systèmes de coordonnées que toute conversion CAD-vers-GIS rencontre."
date: "2026-10-20"
tags: ["gis","tutorial","cad"]
faq: [{"q":"Is DWG to KMZ conversion really free?","a":"Yes. On geoo.app the converter is free with no sign-up, no watermarks and no daily limits. Because processing happens in your browser via WebAssembly, there is no server cost per conversion to pass on to you."},{"q":"Will my DWG file be uploaded anywhere?","a":"No. The conversion runs entirely on your device — the file is read, converted and written back locally. Nothing is sent to a server, which matters for confidential or client drawings."},{"q":"Why does my converted drawing appear at the wrong location?","a":"Almost always because the CAD drawing uses local project coordinates rather than geographic ones. Set the source coordinate system explicitly (search any EPSG code in the converter), or shift the geometry with a georeferencing step before converting."},{"q":"What is the difference between KML and KMZ?","a":"KMZ is simply a KML file packaged in a ZIP archive, optionally with icons and overlays alongside it. Google Earth opens both; KMZ is the more convenient single-file format for sharing."},{"q":"Which DWG versions are supported?","a":"Common AutoCAD releases from R14 through the 2013+ format are handled by the in-browser CAD reader. Very new or civil-3D-heavy files with custom objects may partially convert — check the data preview before downloading."}]
translationOf: "how-to-convert-dwg-to-kmz"
---

**TL;DR :** Ouvrez [geoo.app's converter](https://geoo.app/tools/converter), déposez un `.dwg`, choisissez **KMZ** comme format cible, cliquez sur Convert, téléchargez. Aucune installation, aucun compte — et comme tout s'exécute localement via WebAssembly, votre dessin CAO ne quitte jamais votre machine. Vous trouverez ci-dessous le guide complet, réalisé sur un vrai fichier AutoCAD, y compris le piège du système de coordonnées qui fait échouer la plupart des conversions de CAO vers SIG.

J'avais déjà écrit à propos de [why I built geoo.app](/blog/introducing-geoo-app). Ce billet passe à la pratique : une conversion spécifique, réellement pénible — **DWG vers KMZ** — et comment elle se déroule concrètement dans l'outil.

## Pourquoi cette conversion particulière est si pénible

DWG et KMZ vivent dans des univers différents qui doivent constamment communiquer entre eux :

- **DWG** est le format binaire natif d'AutoCAD — la lingua franca des géomètres, ingénieurs et architectes.
- **KMZ** est la version compressée du KML, le format que Google Earth (et Google Maps, et Google My Maps) consomme nativement.

Dès qu'un dessin de génie civil doit être examiné par un client, une collectivité, ou quiconque n'a pas de licence CAO, la conversation finit invariablement par « peux-tu m'envoyer quelque chose que je peux ouvrir dans Google Earth ? ».

Les réponses traditionnelles font toutes mal : workflows d'export SIG ou AutoCAD sur ordinateur (licence, courbe d'apprentissage), `ogr2ogr` en ligne de commande (bien, si vous savez déjà que ça existe), ou un convertisseur en ligne — qui charge discrètement votre dessin sur le serveur de quelqu'un d'autre.

## Le guide pas à pas

Pour ce test, j'ai utilisé un vrai fichier AutoCAD — `polyline2d_line_2007.dwg` de la collection de tests publique [nextgis/dwg_samples](https://github.com/nextgis/dwg_samples) — donc chaque capture d'écran ci-dessous est une conversion réelle, pas une maquette.

### Étape 1 — Déposez le DWG

Rendez-vous sur le [format converter](https://geoo.app/tools/converter) et glissez le fichier sur le panneau de téléversement. Le format est détecté automatiquement comme **AutoCAD DWG** :

![geoo.app converter with a DWG file loaded, source format auto-detected and a coordinate system notice](/images/geoo-app/dwg-to-kmz-step1.png)

Notez l'avertissement que vous verrez avec de nombreux fichiers CAO : *« Impossible de détecter automatiquement le système de coordonnées source. »* Ce n'est pas l'outil qui fait des difficultés — c'est le DWG qui est honnête. J'y reviens plus bas, car c'est le point le plus important à comprendre lorsqu'on transfère des données CAO sur une carte.

### Étape 2 — Choisissez KMZ et convertissez

Dans le menu déroulant du format cible, choisissez **KMZ**. Puis cliquez sur **Start Conversion**. Pour un fichier de cette taille, l'opération se termine en quelques secondes :

![converter showing KMZ selected as target format and a green Success badge after conversion](/images/geoo-app/dwg-to-kmz-step2.png)

Le badge vert **Success** signifie que la géométrie a traversé le pipeline — lue en DWG, conservée en GeoJSON en mémoire, puis sérialisée en KMZ — le tout dans l'onglet du navigateur.

### Étape 3 — Prévisualisez avant de télécharger

C'est l'étape que la plupart des convertisseurs sautent. Cliquez sur **Preview Result** et vous obtenez une table attributaire contenant exactement ce qui arrivera dans votre KMZ :

![data preview showing one converted feature in EPSG:4326 with layer, handle and color attributes preserved](/images/geoo-app/dwg-to-kmz-step3.png)

Ici, la polyligne apparaît comme **1 entité** en **EPSG:4326 (WGS84)** — le système de coordonnées exigé par KMZ — et regardez les colonnes : `layer`, `handle`, `color`. Les propriétés CAO ont survécu au voyage. Vos calques et handles d'objets ne s'évaporent pas à la frontière du format ; ils arrivent sous forme d'attributs SIG que vous pouvez filtrer et styliser de l'autre côté.

Convaincu ? **Download Result** et vous obtenez un `.kmz` que vous pouvez double-cliquer directement dans Google Earth, ou importer dans My Maps.

## La vérification de réalité des systèmes de coordonnées

Vous vous souvenez de l'avertissement de l'étape 1 ? Voici ce que tout voyageur de CAO vers SIG doit savoir.

La plupart des dessins d'ingénierie sont tracés en **coordonnées locales de projet** — des origines arbitraires comme (0,0) quelque part sur le site, souvent en mètres. Les formats géographiques comme KML/KMZ exigent la **longitude/latitude WGS84**. Si personne n'a jamais enregistré à quel CRS réel le dessin se rapporte, aucun convertisseur au monde ne peut le placer magiquement — l'information n'est tout simplement pas dans le fichier.

Concrètement, lors d'une conversion DWG vers KMZ, vous rencontrerez l'une des trois situations suivantes :

1. **Le dessin est déjà géoréférencé** (les dessins topographiques le sont souvent, dans un CRS projeté comme une zone UTM). Utilisez le sélecteur de système de coordonnées du convertisseur — chaque code EPSG est interrogeable — pour déclarer le CRS source, et la sortie sera reprojetée correctement en WGS84.
2. **Le dessin est en coordonnées locales, mais vous connaissez le point d'ancrage.** Convertissez la géométrie, puis corrigez le positionnement — un outil de décalage de coordonnées ou une passe de géoréférencement place l'ensemble du dessin à son emplacement réel.
3. **Personne ne sait rien.** La géométrie (lignes, polylignes, blocs) se convertit quand même proprement — vous la trouverez simplement en train de nager près de (0°, 0°) dans l'Atlantique jusqu'à ce que vous la placiez. Pour un échange de géométrie pur — « vérifie cet alignement », « compte ces parcelles » — c'est souvent parfaitement acceptable.

Le convertisseur vous indique dans quelle situation vous vous trouvez avant que vous ne téléchargiez quoi que ce soit. Cette transparence est précisément la raison d'être de l'aperçu.

## Conseils pour une sortie CAO → KMZ propre

- **Épurez avant de convertir.** Les lignes de construction figées et les textes égarés font exploser le nombre d'entités sans aucun bénéfice. Un rapide `PURGE`/`OVERKILL` dans AutoCAD garde le KMZ léger.
- **Pensez en calques.** Les calques DWG deviennent des attributs SIG (vous avez vu `layer` dans l'aperçu) — une structure de calques bien organisée se convertit en une carte propre et stylisable.
- **Les courbes sont discrétisées.** Les arcs, cercles et splines sont approximés en polylignes lors de la conversion, ce qui est la pratique standard — n'espérez simplement pas que les métadonnées de rayon survivent.
- **Vérifiez la table d'aperçu, pas seulement le badge Success.** Trente secondes d'inspection des nombres d'entités et des attributs vous épargnent une heure de « pourquoi mon dessin est-il vide dans Google Earth ? ».

## Conclusion

DWG vers KMZ est le genre de conversion que personne ne fait pour le plaisir — vous la faites parce que quelqu'un doit *voir* le dessin. Avec [geoo.app](https://geoo.app/tools/converter), c'est désormais une affaire de trente secondes, sans installation ni téléversement : déposer, choisir KMZ, convertir, prévisualiser, télécharger. Et si votre parcours est l'inverse — du KML vers les formats CAO — le même convertisseur couvre aussi cette direction.

Curieux de connaître la boîte à outils dans laquelle tout cela s'inscrit ? J'ai raconté toute l'histoire dans [Introducing geoo.app](/blog/introducing-geoo-app).
