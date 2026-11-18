---
title: "DWG vers KML dans le navigateur : des entités CAD aux coordonnées géographiques"
description: "Comment un navigateur convertit des dessins AutoCAD DWG en KML pour Google Earth — analyse des entités avec WebAssembly, décision des géométries à conserver, gestion des systèmes de coordonnées et écriture de l'export. Avec du TypeScript fonctionnel adapté de l'implémentation de geoo.app."
date: "2026-10-23"
tags: ["gis","tutorial","webassembly","cad"]
faq: [{"q":"Can a DWG file be converted to KML entirely in the browser?","a":"Yes. A WebAssembly build of LibreDWG parses the DWG on the client, proj4 handles reprojection to WGS84, and JavaScript assembles the KML — so the drawing never has to leave the device."},{"q":"Which CAD entities does this approach cover?","a":"The worked example handles 2D points, straight lines, and lightweight polylines without arc segments. Circles, arcs, and block references need their own adapters and are deliberately out of scope."},{"q":"Why does my converted drawing land in the wrong place?","a":"Almost always because the source coordinate system was never confirmed. XY values from a CAD drawing have no geographic meaning until the real CRS — or registration parameters for a local grid — is applied before writing longitude and latitude."},{"q":"Does local processing mean no network traffic at all?","a":"No. The application's scripts and WASM runtime still download normally; what stays local is the drawing itself. Inspect the browser's Network panel to confirm file contents are never transmitted."}]
translationOf: "dwg-to-kml-in-the-browser"
---

**TL;DR :** Une conversion DWG vers KML implique quatre tâches — lire les entités CAO, décider quelles géométries sont conservées, transformer les coordonnées planes en longitude/latitude WGS84, et écrire le KML. Les quatre peuvent s'exécuter dans le navigateur avec WebAssembly et proj4, si bien que le dessin ne quitte jamais l'appareil. Ce guide pas à pas présente le code TypeScript fonctionnel, adapté de l'implémentation que j'utilise sur [geoo.app](https://geoo.app).

Vous disposez d'un dessin DWG et souhaitez voir ses limites de parcelles dans Google Earth. Obtenir un KML exploitable demande quelques étapes distinctes. Lire les entités CAO, comprendre la signification de leurs coordonnées, et écrire la géométrie dans un format utilisable par la carte.

Tout cela peut s'exécuter dans un navigateur. JavaScript lit un fichier sélectionné sur l'appareil de l'utilisateur, WebAssembly analyse le DWG, et le code côté client gère la reprojection et l'export. Le serveur fournit l'application et ses ressources d'exécution. Le dessin lui-même peut rester sur l'appareil pendant toute la conversion.

C'est l'approche que j'utilise lors du développement de [geoo.app](https://geoo.app). Les exemples ci-dessous sont adaptés de l'implémentation du projet et écrits en TypeScript. Ils couvrent délibérément un sous-ensemble restreint de la géométrie CAO : points 2D, lignes droites, et polylignes légères sans segments d'arc. Les entités plus complexes nécessitent leurs propres adaptateurs.

![Conceptual illustration of DWG points, lines, and boundaries becoming KML objects](/images/dwg-to-kml/01-cover.jpg)

*Figure 1. Vue conceptuelle de la conversion géométrique. Cela n'implique pas que toutes les informations CAO survivent à l'export.*

## Décider ce que vous voulez extraire

Un DWG peut contenir de la géométrie de l'espace objet, du texte, des cotes, des références de blocs, des présentations et d'autres informations CAO. Le KML décrit des objets géographiques, notamment des points, des lignes, des polygones et leurs propriétés associées.

Pour un calque de parcelles, la limite et sa localisation sont généralement prioritaires. Préserver le placement du texte, les motifs de lignes et les remplissages est un travail plus important. Chacun nécessite une règle de conversion explicite ; un analyseur de géométrie seul ne reproduira pas un dessin fini.

Je commence par la géométrie 2D et les propriétés de base telles que le nom du calque. Un POINT devient un point, une LINE devient un segment de ligne, et une polyligne légère devient une ligne (line string). Une polyligne fermée peut devenir un polygone lorsque l'application sait qu'elle représente une limite de zone.

Cette dernière décision appartient à l'application. Une ligne fermée n'est pas automatiquement une zone dans tous les dessins. Cet exemple traite les polylignes fermées comme des polygones par simplicité. Un produit pourrait plutôt exposer une option « exporter comme polygone ».

Les cercles et les arcs doivent être approchés par des sommets, avec un compromis entre précision de la forme et taille de sortie. Les références de blocs exigent la définition du bloc et ses transformations d'insertion, d'échelle et de rotation. Exporter uniquement un point d'insertion laisse de côté la géométrie contenue dans le bloc. Un rapport de conversion devrait rendre ces omissions visibles en enregistrant les types d'entités non pris en charge et les nombres d'éléments ignorés.

## Lire le DWG avec WebAssembly

Un analyseur de texte peut lire certaines formes de DXF. Le DWG utilise un format différent. Le lire ligne par ligne comme une chaîne de caractères, ou changer son extension, ne effectuera pas de conversion.

Le projet utilise `@mlightcad/libredwg-web`, un analyseur basé sur LibreDWG qui s'exécute dans le navigateur. Le [libredwg-web project documentation](https://github.com/mlightcad/libredwg-web) décrit la bibliothèque et ses API.

Installez d'abord les dépendances. Ces extraits utilisent l'interface de l'analyseur 0.7.9 du projet. Vérifiez les définitions de types et les chemins des ressources d'exécution lors des mises à niveau.
```bash
pnpm add @mlightcad/libredwg-web@0.7.9 proj4
pnpm add -D @types/geojson
```Copiez les ressources du runtime WASM du package correspondant dans un répertoire statique tel que `public/lib/libredwg/`, en conservant leurs noms de fichiers tels quels. Passez le répertoire accessible depuis le navigateur à l'initialiseur. Après le déploiement, vérifiez que la requête WASM aboutit et que la plateforme d'hébergement n'a pas renvoyé une page HTML de repli à sa place.
```ts
import { LibreDwg } from '@mlightcad/libredwg-web';

let enginePromise: ReturnType<typeof LibreDwg.create> | undefined;

function getEngine() {
  enginePromise ??= LibreDwg.create('/lib/libredwg').catch(error => {
    enginePromise = undefined;
    throw error;
  });
  return enginePromise;
}

async function readDwg(file: File) {
  const engine = await getEngine();
  const buffer = await file.arrayBuffer();
  const pointer = engine.dwg_read_data(buffer, 0); // 0 means DWG
  if (!pointer) throw new Error('Could not parse the DWG');

  try {
    return engine.convert(pointer);
  } finally {
    engine.dwg_free(pointer);
  }
}
```À ce stade, le fichier sélectionné est devenu une base de données CAD accessible depuis JavaScript. Il a été lu via la File API. Ce code ne fait aucune requête réseau contenant le dessin.

Je mets en cache la Promise d'initialisation afin que les fichiers suivants puissent réutiliser le moteur. Les données du parseur natif sont libérées après leur conversion en objets JavaScript. Avec un dessin volumineux, le tampon d'entrée, les données du parseur et les objets exportés peuvent tous occuper de la mémoire simultanément. Libérer les allocations natives est important lorsque les utilisateurs convertissent plusieurs fichiers à la suite.

Dans React ou Next.js, exécutez ce code côté client. Le parseur peut être chargé dynamiquement lorsqu'un utilisateur sélectionne un DWG, plutôt qu'à chaque visite de page. Sérialisez également les tâches sur un moteur partagé, ou désactivez la soumission pendant qu'une conversion est en cours, afin que des clics répétés ne lancent pas des traitements qui se chevauchent.

![Browser-local pipeline from DWG input through WASM and WGS84 conversion to KML download](/images/dwg-to-kml/02-pipeline.jpg)

*Figure 2. Le dessin est traité dans le navigateur. La page et le runtime WASM peuvent encore devoir être téléchargés via le réseau.*

## Normaliser la géométrie avant l'export

Le parseur renvoie des entités CAD. Je les convertis en une représentation de type GeoJSON avant de traiter les coordonnées et l'export. Cela donne au code d'aperçu et aux autres exportateurs la même géométrie à manipuler, au lieu de mélanger le formatage KML dans chaque adaptateur d'entité.

Il y a une précision importante ici. Avant que les coordonnées source n'aient été converties en WGS84, il s'agit d'une structure de données interne qui emprunte la forme de GeoJSON. Ne publiez pas des coordonnées XY projetées comme s'il s'agissait d'un fichier GeoJSON conforme aux standards.

L'adaptateur suivant gère trois types d'entités et conserve le nom du calque dans les propriétés. Il ignore les polylignes légères avec un bulge non nul. Un bulge décrit un segment d'arc ; relier simplement ses extrémités changerait la forme.
```ts
import type {
  DwgEntity, DwgPointEntity, DwgLineEntity, DwgLWPolylineEntity,
} from '@mlightcad/libredwg-web';
import type { Feature, Point, LineString, Polygon } from 'geojson';

type Shape = Point | LineString | Polygon;
type Item = Feature<Shape, { layer: string }>;
const xy = (p: { x: number; y: number }) => [p.x, p.y];

function toFeature(entity: DwgEntity): Item | null {
  if (entity.isVisible === false) return null;
  let geometry: Shape;

  if (entity.type === 'POINT') {
    const point = entity as DwgPointEntity;
    geometry = { type: 'Point', coordinates: xy(point.position) };
  } else if (entity.type === 'LINE') {
    const line = entity as DwgLineEntity;
    geometry = {
      type: 'LineString',
      coordinates: [xy(line.startPoint), xy(line.endPoint)],
    };
  } else if (entity.type === 'LWPOLYLINE') {
    const line = entity as DwgLWPolylineEntity;
    if (line.vertices.some(v => v.bulge)) return null;
    const points = line.vertices.map(xy);
    const closed = (line.flag & 1) !== 0;
    if (points.length < (closed ? 3 : 2)) return null;

    if (closed) {
      const first = points[0];
      const last = points[points.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        points.push([...first]);
      }
      geometry = { type: 'Polygon', coordinates: [points] };
    } else {
      geometry = { type: 'LineString', coordinates: points };
    }
  } else {
    return null;
  }

  return {
    type: 'Feature',
    properties: { layer: entity.layer || '0' },
    geometry,
  };
}
```L'exemple suppose des entités 2D planes ordinaires. Il ne gère pas les systèmes de coordonnées d'objets avec des directions d'extrusion non standard. Un adaptateur de production doit prendre en charge la conversion OCS vers WCS avant de placer les entités dans un espace de coordonnées commun. Le filtrage espace modèle / espace papier doit également être traité explicitement, afin que les cartouches de titre et les éléments de mise en page ne deviennent pas des entités cartographiques.

Lorsque l'adaptateur renvoie null, l'appelant devrait enregistrer la raison pour laquelle l'entité a été ignorée. Un dessin valide qui ne produit aucune entité prise en charge mérite un message différent d'un fichier endommagé ou illisible. « Aucune géométrie prise en charge trouvée » donne à l'utilisateur une prochaine étape utile.

## Les coordonnées décident de l'emplacement du dessin

Lire des valeurs XY ne nous dit pas où elles se situent sur Terre. Un dessin peut utiliser des mètres, des millimètres ou une grille locale propre à un projet. Chaque sommet peut être extrait correctement et se retrouver quand même au mauvais endroit si les coordonnées sources sont interprétées incorrectement.

Les tuples de coordonnées KML utilisent la longitude, la latitude et une altitude optionnelle. La [KML reference](https://developers.google.com/kml/documentation/kmlreference) documente leur ordre ainsi que les modes d'altitude. Cet exemple 2D convertit les coordonnées horizontales en WGS84 et utilise une sortie ancrée au sol, avec la longitude en premier et la latitude en second.

Pour un système de référence de coordonnées source connu, Proj4js peut effectuer la transformation. Son API source-versus-cible est documentée dans la [Proj4js repository](https://github.com/proj4js/proj4js). Pour un dessin confirmé comme utilisant Web Mercator, la source pourrait être EPSG:3857. Il s'agit d'un exemple, et non d'une valeur par défaut pour les fichiers DWG. Utilisez la définition qui correspond réellement au dessin.
```ts
import proj4 from 'proj4';

function projectPosition(position: number[], sourceCrs: string) {
  const [x, y] = position;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('Source coordinates contain invalid values');
  }
  const [lon, lat] = proj4(sourceCrs, 'EPSG:4326', [x, y]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat) ||
      Math.abs(lon) > 180 || Math.abs(lat) > 90) {
    throw new Error('Coordinates are out of range; check the source CRS');
  }
  return [lon, lat];
}

function projectFeature(feature: Item, sourceCrs: string): Item {
  const g = feature.geometry;
  const convert = (p: number[]) => projectPosition(p, sourceCrs);
  let geometry: Shape;
  if (g.type === 'Point') {
    geometry = { type: 'Point', coordinates: convert(g.coordinates) };
  } else if (g.type === 'LineString') {
    geometry = { type: 'LineString', coordinates: g.coordinates.map(convert) };
  } else {
    geometry = {
      type: 'Polygon',
      coordinates: g.coordinates.map(ring => ring.map(convert)),
    };
  }
  return { ...feature, geometry };
}
```La vérification des plages détecte les erreurs évidentes. Elle ne peut pas prouver que l'emplacement est correct. Des coordonnées peuvent se trouver dans des plages de longitude et de latitude valides tout en étant très loin du site visé. Vérifiez un point de contrôle, une intersection routière connue ou un autre lieu de référence fiable.

Un système de coordonnées local d'ingénierie nécessite généralement des points de contrôle et des paramètres de géoréférencement avant de pouvoir être relié à des coordonnées géographiques. Demandez ces informations plutôt que d'attribuer un code EPSG arbitraire. Les données projetées comportant des numéros de zone, des méridiens centraux différents ou des préfixes de coordonnées nécessitent également la confirmation de leur définition exacte.

Cet exemple ignore les valeurs Z. Un export 3D exige une décision concernant les unités verticales d'origine, le datum vertical et le mode d'altitude KML. Copier la troisième coordonnée CAD dans un champ d'altitude absolue peut placer des objets au-dessus ou en dessous de leur position prévue.

![Known source CRS transformed through proj4 into WGS84 longitude and latitude](/images/dwg-to-kml/03-coordinates.jpg)

*Figure 3. Établissez d'abord le CRS source. Un système local nécessite des informations de géoréférencement telles que des points de contrôle.*

## Écrire le KML et le télécharger

Une fois la géométrie et les coordonnées prêtes, il existe quelques options d'export pratiques. Un projet peut utiliser une version navigateur de GDAL pour écrire du KML et réutiliser un pipeline d'export existant. Pour le sous-ensemble de points, lignes et polygones de ce tutoriel, un petit sérialiseur rend également la sortie facile à inspecter.

La fonction ci-dessous accepte le type Item défini précédemment et suppose que la reprojection a déjà été effectuée. Elle stocke le nom de la couche dans ExtendedData et utilise le nom de la couche plus un index comme nom d'entité. Les caractères XML doivent être échappés afin qu'une couche contenant une esperluette ne casse pas le document.
```ts
function xml(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toKml(items: Item[]) {
  const coords = (points: number[][]) =>
    points.map(([lon, lat]) => `${lon},${lat},0`).join(' ');
  const ring = (points: number[][]) =>
    `<LinearRing><coordinates>${coords(points)}</coordinates></LinearRing>`;

  const placemarks = items.map((item, index) => {
    const g = item.geometry;
    let shape: string;
    if (g.type === 'Point') {
      shape = `<Point><coordinates>${coords([g.coordinates])}</coordinates></Point>`;
    } else if (g.type === 'LineString') {
      shape = `<LineString><coordinates>${coords(g.coordinates)}</coordinates></LineString>`;
    } else {
      const [outer, ...holes] = g.coordinates;
      shape = `<Polygon><outerBoundaryIs>${ring(outer)}</outerBoundaryIs>` +
        holes.map(h => `<innerBoundaryIs>${ring(h)}</innerBoundaryIs>`).join('') +
        '</Polygon>';
    }
    const layer = xml(item.properties.layer);
    return `<Placemark><name>${layer}-${index + 1}</name>` +
      `<ExtendedData><Data name="layer"><value>${layer}</value></Data></ExtendedData>` +
      shape + '</Placemark>';
  });

  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>' +
    placemarks.join('') + '</Document></kml>';
}

function downloadKml(content: string) {
  const blob = new Blob([content], {
    type: 'application/vnd.google-earth.kml+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'converted.kml';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```Placez les extraits dans le même module client et connectez-les à un événement de sélection de fichier. L'appelant doit obtenir un CRS source confirmé et empêcher toute nouvelle soumission pendant que la conversion s'exécute.
```ts
async function convertAndDownload(file: File, sourceCrs: string) {
  if (!sourceCrs) throw new Error('Confirm the source CRS first');
  const database = await readDwg(file);
  const features = database.entities
    .map(toFeature)
    .filter((feature): feature is Item => feature !== null);
  if (!features.length) throw new Error('No geometry supported by this example was found');
  downloadKml(toKml(features.map(f => projectFeature(f, sourceCrs))));
}
```Cette version exporte la géométrie et une propriété de base. Elle ne reproduit pas le style CAD et ne crée pas automatiquement de dossiers KML pour les couches CAD. Pour prendre en charge l'activation/désactivation des couches, regroupez les entités par couche et écrivez un Folder pour chaque groupe. Les couleurs KML ont également leur propre encodage ; une chaîne de couleur CSS ne peut pas être copiée telle quelle dans un champ de style KML.

## Vérifier le résultat avec un dessin que vous maîtrisez

Commencez avec un petit fichier dont le contenu est connu. Pour ce projet, j'ai préparé un DWG fictif avec un point, une ligne et une zone fermée, chacun sur sa propre couche. Les coordonnées ont été explicitement définies en WGS84 lors de la création du fichier de test. Il ne contient aucune donnée de projet réelle.

La conversion dans le navigateur a produit trois entités et trois Placemarks KML. Les types de géométrie et les noms de couches correspondaient au fichier de test. J'ai également ouvert le KML exporté dans la visionneuse du navigateur pour inspecter l'affichage du point, de la ligne et du polygone présenté ci-dessous. Cela ne remplace pas une vérification dans Google Earth ou dans l'application que le destinataire utilisera.

![The fictional KML fixture displayed in the geoo.app browser viewer](/images/dwg-to-kml/04-sample-viewer.png)

*Figure 4. Une visionneuse KML dans le navigateur affichant le fichier de test WGS84 fictif. Ceci n'est pas une capture d'écran de Google Earth.*

Un petit fichier de test facilite la détection des objets et propriétés manquants. Une fois que cela fonctionne, ajoutez séparément les arcs, le texte et les références de blocs. Si un nouveau cas échoue, il y a un ensemble de code beaucoup plus restreint à examiner.

Avec de vrais dessins, inspectez l'étendue globale et échantillonnez quelques positions connues. Des ordres de grandeur de coordonnées inattendus suggèrent de vérifier les unités, l'ordre des axes et le CRS source. Des raccourcis rectilignes traversant une limite courbe suggèrent des segments d'arc de polyligne non gérés. Des symboles manquants peuvent provenir de références de blocs qui n'ont pas été développées.

Les fichiers volumineux nécessitent également une vérification de la réactivité. WebAssembly ne s'exécute pas automatiquement sur un thread d'arrière-plan. L'analyse synchrone peut bloquer l'UI, comme tout autre travail sur le thread principal. Un Web Worker peut héberger l'analyse et le traitement des coordonnées si nécessaire. Les messages de progression doivent correspondre à des étapes réelles telles que la lecture, l'analyse, la reprojection et l'exportation.

L'utilisation de la mémoire dépend du nombre d'entités, du nombre de sommets et du nombre de copies intermédiaires encore en vie. La réussite avec un petit fichier en dit peu sur le plus grand dessin qu'un appareil donné peut gérer. Testez des fichiers représentatifs et gardez les erreurs de mémoire insuffisante et d'analyse compréhensibles pour l'utilisateur.

## Utiliser un outil de navigateur si vous n'avez besoin que de la conversion

Pour un fichier occasionnel, développer une application est inutile. Un outil de navigateur peut faire le travail s'il prend en charge l'entrée DWG, permet de confirmer le CRS source et traite le fichier là où vous l'attendez.

Vérifiez ce qui se passe après la sélection du fichier. Certains sites téléversent le dessin et le convertissent sur un serveur. D'autres chargent un analyseur dans le navigateur et créent le résultat localement. Pour les dessins contenant des limites de site ou des emplacements d'installations, le traitement local supprime l'étape de remise du dessin à un serveur de conversion tiers.

Le traitement local ne signifie pas que la page n'a aucun trafic réseau. Les scripts, les binaires WASM et autres ressources applicatives peuvent encore nécessiter un téléchargement, et un site peut utiliser des outils d'analyse. Distinguez ces requêtes de la transmission du dessin lui-même. Les développeurs peuvent inspecter le panneau Network en parallèle de l'implémentation pour vérifier si le contenu du fichier est envoyé pendant la conversion. Une exigence hors ligne est plus stricte : les dépendances d'exécution doivent également être disponibles localement, et l'ensemble du flux de travail doit être testé sans connexion.

Je développe [geoo.app](https://geoo.app), qui inclut un [DWG-to-KML converter](https://geoo.app/tools/converter) utilisant l'analyse et la conversion côté client. Sélectionnez le dessin, confirmez le CRS source, puis téléchargez le KML et inspectez-le dans une application cartographique compatible. C'est une option pour les personnes qui préfèrent un flux de travail dans le navigateur et qui veulent éviter de téléverser leur dessin sur un serveur de conversion.

![The real geoo.app DWG-to-KML interface with source CRS settings](/images/dwg-to-kml/05-converter.png)

*Figure 5. L'interface réelle du convertisseur. Ce fichier de test a des coordonnées WGS84 connues, donc le CRS source et le CRS de sortie sont tous deux en WGS84.*

Le fichier nécessite toujours un système de coordonnées connu. Demandez au fournisseur du dessin quand ce n'est pas clair, et obtenez les informations d'enregistrement pour les grilles locales. Vérifiez un emplacement connu dans le résultat téléchargé avant de le transmettre.

![Successful conversion of the fictional DWG fixture and the KML download controls](/images/dwg-to-kml/06-conversion-result.png)

*Figure 6. Une conversion réelle du fichier de test fictif contenant un point, une ligne et une zone fermée.*

Pour une première tentative, utilisez un dessin avec un point connu et une courte ligne. Une fois leurs positions correctes sur la carte, passez à la géométrie de la limite et au reste du dessin.

## Lectures complémentaires

- Vous préférez ne pas écrire de code ? [How to Convert DWG to KMZ — Free, Right in Your Browser](/blog/how-to-convert-dwg-to-kmz) présente la même conversion du point de vue de l'utilisateur, sans TypeScript requis.
- Curieux de savoir ce que fait cette boîte à outils ? Consultez [Introducing geoo.app](/blog/introducing-geoo-app).
