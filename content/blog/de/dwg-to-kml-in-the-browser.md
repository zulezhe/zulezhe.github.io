---
title: "DWG zu KML im Browser: Von CAD-Elementen zu geografischen Koordinaten"
description: "Wie ein Browser AutoCAD-DWG-Zeichnungen in Google Earth KML konvertiert — Entities mit WebAssembly parsen, entscheiden, welche Geometrie überlebt, Koordinatensysteme handhaben und den Export schreiben. Mit funktionierendem TypeScript, adaptiert aus der geoo.app-Implementierung."
date: "2026-10-23"
tags: ["gis","tutorial","webassembly","cad"]
faq: [{"q":"Can a DWG file be converted to KML entirely in the browser?","a":"Yes. A WebAssembly build of LibreDWG parses the DWG on the client, proj4 handles reprojection to WGS84, and JavaScript assembles the KML — so the drawing never has to leave the device."},{"q":"Which CAD entities does this approach cover?","a":"The worked example handles 2D points, straight lines, and lightweight polylines without arc segments. Circles, arcs, and block references need their own adapters and are deliberately out of scope."},{"q":"Why does my converted drawing land in the wrong place?","a":"Almost always because the source coordinate system was never confirmed. XY values from a CAD drawing have no geographic meaning until the real CRS — or registration parameters for a local grid — is applied before writing longitude and latitude."},{"q":"Does local processing mean no network traffic at all?","a":"No. The application's scripts and WASM runtime still download normally; what stays local is the drawing itself. Inspect the browser's Network panel to confirm file contents are never transmitted."}]
translationOf: "dwg-to-kml-in-the-browser"
---

**TL;DR:** Eine DWG-zu-KML-Konvertierung besteht aus vier Aufgaben — die CAD-Entitäten lesen, entscheiden, welche Geometrie übernommen wird, ebene Koordinaten in WGS84-Länge/Breite umwandeln und das KML schreiben. Alle vier können im Browser mit WebAssembly und proj4 laufen, sodass die Zeichnung das Gerät nie verlässt. Diese Anleitung zeigt den funktionierenden TypeScript-Code, angepasst an die Implementierung, die ich auf [geoo.app](https://geoo.app) verwende.

Sie haben eine DWG-Zeichnung und möchten die Flurstücksgrenzen in Google Earth sehen. Ein brauchbares KML daraus zu gewinnen erfordert einige eigenständige Schritte: Die CAD-Entitäten lesen, herausfinden, was ihre Koordinaten bedeuten, und die Geometrie in einem Format schreiben, das die Karte verwenden kann.

All das kann im Browser laufen. JavaScript liest eine Datei, die auf dem Gerät des Benutzers ausgewählt wurde, WebAssembly parst die DWG, und clientseitiger Code übernimmt Reprojektion und Export. Der Server liefert die Anwendung und ihre Laufzeit-Assets. Die Zeichnung selbst kann während der gesamten Konvertierung auf dem Gerät bleiben.

Das ist der Ansatz, den ich bei der Entwicklung von [geoo.app](https://geoo.app) verwende. Die folgenden Beispiele sind aus der Implementierung des Projekts abgeleitet und in TypeScript geschrieben. Sie decken bewusst nur eine kleine Teilmenge von CAD-Geometrie ab: 2D-Punkte, gerade Linien und leichtgewichtige Polylines ohne Bogensegmente. Komplexere Entitäten benötigen eigene Adapter.

![Conceptual illustration of DWG points, lines, and boundaries becoming KML objects](/images/dwg-to-kml/01-cover.jpg)

*Abbildung 1. Eine konzeptionelle Darstellung der Geometriekonvertierung. Sie impliziert nicht, dass jede CAD-Information den Export übersteht.*

## Entscheiden, was Sie extrahieren möchten

Eine DWG kann Modellraum-Geometrie, Text, Bemaßungen, Blockreferenzen, Layouts und andere CAD-Informationen enthalten. KML beschreibt geografische Objekte, darunter Punkte, Linien, Polygone und ihre zugehörigen Eigenschaften.

Bei einem Flurstücks-Overlay stehen die Grenze und ihre Lage meist im Vordergrund. Die Positionierung von Text, Linienmuster und Füllungen zu erhalten, ist eine größere Aufgabe. Jedes davon benötigt eine explizite Konvertierungsregel; ein Geometrie-Parser allein reproduziert keine fertige Zeichnung.

Ich beginne mit 2D-Geometrie und grundlegenden Eigenschaften wie dem Layer-Namen. Ein POINT wird zu einem Punkt, ein LINE zu einem Liniensegment, und eine leichtgewichtige Polyline wird zu einem LineString. Eine geschlossene Polyline kann zu einem Polygon werden, wenn die Anwendung weiß, dass sie eine Flächengrenze darstellt.

Diese letzte Entscheidung gehört zur Anwendung. Eine geschlossene Linie ist nicht in jeder Zeichnung automatisch eine Fläche. Dieses Beispiel behandelt geschlossene Polylines der Einfachheit halber als Polygone. Ein Produkt könnte stattdessen eine Option „als Polygon exportieren" anbieten.

Kreise und Bögen müssen durch Vertices angenähert werden, mit einem Kompromiss zwischen Formgenauigkeit und Ausgabegröße. Blockreferenzen erfordern die Blockdefinition und ihre Transformtionen für Einfügung, Skalierung und Rotation. Wird nur ein Einfügepunkt exportiert, bleibt die Geometrie im Block außen vor. Ein Konvertierungsbericht sollte diese Auslassungen sichtbar machen, indem nicht unterstützte Entitätstypen und übersprungene Elemente gezählt werden.

## Die DWG mit WebAssembly lesen

Ein Text-Parser kann einige Formen von DXF lesen. DWG verwendet ein anderes Format. Sie zeilenweise als Zeichenkette zu lesen oder die Dateiendung zu ändern, führt zu keiner Konvertierung.

Das Projekt verwendet `@mlightcad/libredwg-web`, einen auf LibreDWG basierenden Parser, der im Browser läuft. Die [libredwg-web project documentation](https://github.com/mlightcad/libredwg-web) beschreibt die Bibliothek und ihre APIs.

Installieren Sie zunächst die Abhängigkeiten. Diese Ausschnitte verwenden die Parser-Schnittstelle 0.7.9 des Projekts. Prüfen Sie bei einem Upgrade die Typdefinitionen und die Pfade der Laufzeit-Assets.
```bash
pnpm add @mlightcad/libredwg-web@0.7.9 proj4
pnpm add -D @types/geojson
```Kopieren Sie die WASM-Runtime-Assets des passenden Pakets in ein statisches Verzeichnis wie `public/lib/libredwg/` und behalten Sie dabei die Dateinamen bei. Übergeben Sie das über den Browser zugängliche Verzeichnis an den Initialisierer. Prüfen Sie nach dem Deployment, dass die WASM-Anfrage erfolgreich ist und dass die Hosting-Plattform keine HTML-Fallback-Seite stattdessen zurückgegeben hat.
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
```An diesem Punkt ist die ausgewählte Datei zu einer CAD-Datenbank geworden, auf die JavaScript zugreifen kann. Sie wurde über die File API eingelesen. Dieser Code sendet keine Netzwerkanfrage, die die Zeichnung enthält.

Ich cache das Initialisierungs-Promise, damit nachfolgende Dateien die Engine wiederverwenden können. Native Parser-Daten werden nach der Konvertierung in JavaScript-Objekte freigegeben. Bei einer großen Zeichnung können Eingabepuffer, Parser-Daten und exportierte Objekte gleichzeitig Speicher belegen. Das Freigeben nativer Allokationen ist wichtig, wenn Benutzer mehrere Dateien hintereinander konvertieren.

Führen Sie diesen Code in React oder Next.js auf dem Client aus. Der Parser kann dynamisch geladen werden, wenn ein Benutzer eine DWG auswählt, statt bei jedem Seitenaufruf. Serialisieren Sie außerdem Jobs auf einer gemeinsamen Engine oder deaktivieren Sie die Übermittlung, während eine Konvertierung läuft, damit wiederholte Klicks keine sich überlappenden Aufgaben starten.

![Browser-local pipeline from DWG input through WASM and WGS84 conversion to KML download](/images/dwg-to-kml/02-pipeline.jpg)

*Abbildung 2. Die Zeichnung wird im Browser verarbeitet. Die Seite und die WASM-Runtime müssen möglicherweise noch über das Netzwerk heruntergeladen werden.*

## Normalisieren der Geometrie vor dem Export

Der Parser gibt CAD-Entitäten zurück. Ich konvertiere diese in eine GeoJSON-ähnliche Repräsentation, bevor ich Koordinaten verarbeite und exportiere. So arbeiten der Vorschau-Code und andere Exporter mit derselben Geometrie, statt die KML-Formatierung in jeden Entitäts-Adapter zu mischen.

Hier gibt es eine wichtige Einschränkung. Bevor Quellkoordinaten nach WGS84 konvertiert wurden, ist dies eine interne Datenstruktur, die sich die Form von GeoJSON zunutze macht. Veröffentlichen Sie keine projizierten XY-Koordinaten so, als wären sie eine standardkonforme GeoJSON-Datei.

Der folgende Adapter verarbeitet drei Entitätstypen und behält den Layernamen in den Properties bei. Er überspringt Lightweight-Polylines mit einer von null verschiedenen Wölbung (Bulge). Eine Wölbung beschreibt ein Bogensegment; ein einfaches Verbinden ihrer Endpunkte würde die Form verändern.
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
```Das Beispiel geht von gewöhnlichen 2D-Planargeometrien aus. Es behandelt keine Objektkoordinatensysteme mit nicht standardmäßigen Extrusionsrichtungen. Ein Produktionsadapter muss die OCS-zu-WCS-Konvertierung berücksichtigen, bevor Elemente in einen gemeinsamen Koordinatenraum überführt werden. Auch die Filterung nach Modellraum und Papierraum muss explizit behandelt werden, damit Schriftfelder und Layout-Dekorationen nicht zu Karten-Features werden.

Wenn der Adapter null zurückgibt, sollte der Aufrufer protokollieren, warum das Element übersprungen wurde. Eine gültige Zeichnung, die keine unterstützten Features erzeugt, verdient eine andere Meldung als eine beschädigte oder nicht lesbare Datei. „Keine unterstützte Geometrie gefunden" gibt dem Nutzer einen konkreten nächsten Schritt an die Hand.

## Koordinaten entscheiden, wo die Zeichnung landet

Das Auslesen von XY-Werten verrät nicht, wo sie auf der Erde liegen. Eine Zeichnung kann Meter, Millimeter oder ein projektspezifisches lokales Gitter verwenden. Jeder Vertex kann korrekt extrahiert werden und landet dennoch an der falschen Stelle, wenn die Quellkoordinaten falsch interpretiert werden.

KML-Koordinatentupel verwenden Länge, Breite und optional Höhe. Das [KML reference](https://developers.google.com/kml/documentation/kmlreference) dokumentiert deren Reihenfolge sowie die Höhenmodi. Dieses 2D-Beispiel konvertiert horizontale Koordinaten nach WGS84 und verwendet am Boden verankerte Ausgabe, mit Länge zuerst und Breite danach.

Bei einem bekannten Quell-Koordinatenreferenzsystem kann Proj4js die Transformation durchführen. Seine Source-to-Target-API ist im [Proj4js repository](https://github.com/proj4js/proj4js) dokumentiert. Für eine Zeichnung, von der bestätigt ist, dass sie Web Mercator verwendet, könnte die Quelle EPSG:3857 sein. Das ist ein Beispiel, kein Standard für DWG-Dateien. Verwenden Sie die Definition, die tatsächlich zur Zeichnung gehört.
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
```Die Bereichsprüfung erkennt offensichtliche Fehler. Sie kann nicht beweisen, dass die Position korrekt ist. Koordinaten können innerhalb der gültigen Längen- und Breitengradbereiche liegen und sich dennoch weit vom tatsächlichen Zielort befinden. Prüfen Sie einen Kontrollpunkt, eine bekannte Straßenkreuzung oder eine andere zuverlässige Referenzposition.

Ein lokales Vermessungsgitter (engineering grid) benötigt in der Regel Kontrollpunkte und Registrierungsparameter, bevor es auf geografische Koordinaten bezogen werden kann. Fordern Sie diese Informationen an, statt einen willkürlichen EPSG-Code zuzuweisen. Projizierte Daten mit Zonennummern, unterschiedlichen Mittelmeridianen oder Koordinatenpräfixen erfordern ebenfalls eine Bestätigung ihrer exakten Definition.

Dieses Beispiel verwirft Z-Werte. Ein 3D-Export erfordert Entscheidungen über die ursprünglichen vertikalen Einheiten, das vertikale Datum und den KML-Höhenmodus. Das bloße Kopieren der dritten CAD-Koordinate in ein Feld für absolute Höhe kann Objekte über oder unter ihrer beabsichtigten Position platzieren.

![Known source CRS transformed through proj4 into WGS84 longitude and latitude](/images/dwg-to-kml/03-coordinates.jpg)

*Abbildung 3. Legen Sie zunächst die Quell-CRS fest. Ein lokales Gitter benötigt Registrierungsinformationen wie Kontrollpunkte.*

## KML schreiben und herunterladen

Sobald Geometrie und Koordinaten bereitstehen, gibt es ein paar praktische Exportoptionen. Ein Projekt kann einen Browser-Build von GDAL verwenden, um KML zu schreiben und eine bestehende Export-Pipeline weiterzuverwenden. Für die Teilmenge aus Punkten, Linien und Polygonen in diesem Tutorial erleichtert ein kleiner Serializer auch die Inspektion der Ausgabe.

Die folgende Funktion akzeptiert den oben definierten Item-Typ und setzt voraus, dass die Reprojektion bereits erfolgt ist. Sie speichert den Layernamen in ExtendedData und verwendet den Layernamen plus einen Index als Feature-Namen. XML-Zeichen müssen escaped werden, damit ein Layer mit einem kaufmännischen Und das Dokument nicht beschädigt.
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
```Legen Sie die Snippets im selben Client-Modul ab und verknüpfen Sie sie mit einem Dateiauswahl-Event. Der Aufrufer muss eine bestätigte Quell-CRS ermitteln und eine weitere Übermittlung während der laufenden Konvertierung verhindern.
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
```Diese Version exportiert Geometrie und eine grundlegende Eigenschaft. Sie reproduziert weder CAD-Styling noch erstellt sie automatisch KML-Ordner für CAD-Layer. Um Layer-Umschaltung zu unterstützen, gruppieren Sie Features nach Layer und schreiben Sie für jede Gruppe einen Folder. KML-Farben haben zudem eine eigene Kodierung; eine CSS-Farbzeichenkette kann nicht unverändert in ein KML-Style-Feld kopiert werden.

## Ergebnis mit einer bekannten Zeichnung prüfen

Beginnen Sie mit einer kleinen Datei, deren Inhalte bekannt sind. Für dieses Projekt habe ich eine fiktive DWG mit einem Punkt, einer Linie und einer geschlossenen Fläche vorbereitet, jeweils auf einem eigenen Layer. Die Koordinaten wurden beim Erstellen des Testfiles explizit als WGS84 definiert. Es enthält keine echten Projektdaten.

Die Browser-Konvertierung erzeugte drei Features und drei KML-Placemarks. Die Geometrietypen und Layernamen entsprachen dem Testfile. Ich habe den exportierten KML auch im Browser-Viewer geöffnet, um die unten gezeigte Darstellung von Punkt, Linie und Polygon zu prüfen. Das ersetzt keine Kontrolle in Google Earth oder in der Anwendung, die der Empfänger verwenden wird.

![The fictional KML fixture displayed in the geoo.app browser viewer](/images/dwg-to-kml/04-sample-viewer.png)

*Abbildung 4. Ein tatsächlicher KML-Viewer im Browser, der das fiktive WGS84-Testfile anzeigt. Dies ist kein Google-Earth-Screenshot.*

Ein kleines Testfile macht fehlende Objekte und Eigenschaften leichter erkennbar. Sobald es funktioniert, fügen Sie Bögen, Text und Blockreferenzen separat hinzu. Wenn ein neuer Fall fehlschlägt, gibt es einen deutlich kleineren Codebestand zu untersuchen.

Bei echten Zeichnungen prüfen Sie die Gesamtausdehnung und stichprobenartig einige bekannte Positionen. Unerwartete Koordinatengrößen deuten darauf hin, dass Einheiten, Achsenreihenfolge und das Quell-CRS zu kontrollieren sind. Gerade Abkürzungen über eine gekrümmte Grenze deuten auf unbehandelte Polyline-Bogensegmente hin. Fehlende Symbole können von Blockreferenzen stammen, die nicht aufgelöst wurden.

Große Dateien erfordern auch einen Test der Reaktionsfähigkeit. WebAssembly läuft nicht automatisch in einem Background-Thread. Synchrone Verarbeitung kann die UI blockieren, genau wie andere Arbeit im Main-Thread. Ein Web Worker kann bei Bedarf Parsing und Koordinatenverarbeitung übernehmen. Fortschrittsmeldungen sollten echten Schritten entsprechen, etwa Lesen, Parsen, Reprojektion und Export.

Die Speichernutzung hängt von der Anzahl der Entities und Vertices sowie davon ab, wie viele Zwischenkopien am Leben bleiben. Der Erfolg mit einer kleinen Datei sagt wenig über die größte Zeichnung aus, die ein bestimmtes Gerät verarbeiten kann. Testen Sie repräsentative Dateien und halten Sie Out-of-Memory- und Parsing-Fehler für den Benutzer verständlich.

## Ein Browser-Tool verwenden, wenn Sie nur die Konvertierung brauchen

Für eine gelegentliche Datei ist der Aufwand einer eigenen Anwendung unnötig. Ein Browser-Tool kann die Aufgabe erledigen, wenn es DWG-Eingabe unterstützt, die Bestätigung des Quell-CRS ermöglicht und die Datei dort verarbeitet, wo Sie es erwarten.

Prüfen Sie, was nach der Dateiauswahl geschieht. Manche Seiten laden die Zeichnung hoch und konvertieren sie auf einem Server. Andere laden einen Parser in den Browser und erstellen das Ergebnis lokal. Bei Zeichnungen mit Grundstücksgrenzen oder Standortangaben erspart die lokale Verarbeitung den Schritt, die Zeichnung an einen Fremd-Konvertierungsserver zu übergeben.

Lokale Verarbeitung bedeutet nicht, dass die Seite keinen Netzwerkverkehr erzeugt. Skripte, WASM-Binaries und andere Anwendungs-Assets müssen möglicherweise weiterhin heruntergeladen werden, und eine Seite kann Analytics einsetzen. Unterscheiden Sie diese Anfragen von der Übertragung der Zeichnung selbst. Entwickler können den Network-Panel zusammen mit der Implementierung prüfen, um festzustellen, ob Dateiinhalte während der Konvertierung gesendet werden. Eine Offline-Anforderung ist strenger: Auch die Laufzeit-Abhängigkeiten müssen lokal verfügbar sein, und der gesamte Workflow muss ohne Verbindung getestet werden.

Ich entwickle [geoo.app](https://geoo.app), das ein [DWG-to-KML converter](https://geoo.app/tools/converter) mit clientseitigem Parsing und Konvertierung enthält. Wählen Sie die Zeichnung aus, bestätigen Sie das Quell-CRS, laden Sie dann den KML herunter und prüfen Sie ihn in einer kompatiblen Kartenanwendung. Es ist eine Option für alle, die einen Browser-Workflow bevorzugen und ihre Zeichnung nicht auf einen Konvertierungsserver hochladen möchten.

![The real geoo.app DWG-to-KML interface with source CRS settings](/images/dwg-to-kml/05-converter.png)

*Abbildung 5. Die tatsächliche Konvertierer-Oberfläche. Dieses Testfile hat bekannte WGS84-Koordinaten, daher sind sowohl Quell- als auch Ziel-CRS WGS84.*

Die Datei benötigt weiterhin ein bekanntes Koordinatensystem. Fragen Sie den Zeichnungsanbieter, wenn es unklar ist, und besorgen Sie Registrierungsinformationen für lokale Gitter. Prüfen Sie eine bekannte Position im heruntergeladenen Ergebnis, bevor Sie es weitergeben.

![Successful conversion of the fictional DWG fixture and the KML download controls](/images/dwg-to-kml/06-conversion-result.png)

*Abbildung 6. Eine tatsächliche Konvertierung des fiktiven Testfiles mit einem Punkt, einer Linie und einer geschlossenen Fläche.*

Verwenden Sie für einen ersten Versuch eine Zeichnung mit einem bekannten Punkt und einer kurzen Linie. Sobald deren Positionen auf der Karte stimmen, wenden Sie sich der Grenzgeometrie und dem Rest der Zeichnung zu.

## Verwandte Lektüre

- Keine Lust, Code zu schreiben? [How to Convert DWG to KMZ — Free, Right in Your Browser](/blog/how-to-convert-dwg-to-kmz) führt dieselbe Konvertierung als Benutzer durch, ganz ohne TypeScript.
- Neugierig, was dieses Toolbox sonst noch kann? Sehen Sie [Introducing geoo.app](/blog/introducing-geoo-app).
