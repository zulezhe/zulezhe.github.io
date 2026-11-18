---
title: "So konvertierst du DWG in KMZ — kostenlos, direkt im Browser"
description: "Eine Schritt-für-Schritt-Anleitung zum Konvertieren von AutoCAD-DWG-Zeichnungen in Google-Earth-KMZ-Dateien mit geoo.app — keine Software-Installation, keine Konten und keine Datei-Uploads. Enthält die Koordinatensystem-Fallstricke, die jede CAD-zu-GIS-Konvertierung trifft."
date: "2026-10-20"
tags: ["gis","tutorial","cad"]
faq: [{"q":"Is DWG to KMZ conversion really free?","a":"Yes. On geoo.app the converter is free with no sign-up, no watermarks and no daily limits. Because processing happens in your browser via WebAssembly, there is no server cost per conversion to pass on to you."},{"q":"Will my DWG file be uploaded anywhere?","a":"No. The conversion runs entirely on your device — the file is read, converted and written back locally. Nothing is sent to a server, which matters for confidential or client drawings."},{"q":"Why does my converted drawing appear at the wrong location?","a":"Almost always because the CAD drawing uses local project coordinates rather than geographic ones. Set the source coordinate system explicitly (search any EPSG code in the converter), or shift the geometry with a georeferencing step before converting."},{"q":"What is the difference between KML and KMZ?","a":"KMZ is simply a KML file packaged in a ZIP archive, optionally with icons and overlays alongside it. Google Earth opens both; KMZ is the more convenient single-file format for sharing."},{"q":"Which DWG versions are supported?","a":"Common AutoCAD releases from R14 through the 2013+ format are handled by the in-browser CAD reader. Very new or civil-3D-heavy files with custom objects may partially convert — check the data preview before downloading."}]
translationOf: "how-to-convert-dwg-to-kmz"
---

**TL;DR:** Öffne [geoo.app's converter](https://geoo.app/tools/converter), ziehe eine `.dwg` hinein, wähle **KMZ** als Zielformat, klicke auf Convert, lade herunter. Keine Installationen, keine Konten — und da alles lokal über WebAssembly läuft, verlässt deine CAD-Zeichnung niemals deinen Rechner. Unten findest du die vollständige Anleitung, durchgeführt mit einer echten AutoCAD-Datei, einschließlich der Koordinatensystem-Falle, an der die meisten CAD-zu-GIS-Konvertierungen scheitern.

Vor einiger Zeit habe ich über [why I built geoo.app](/blog/introducing-geoo-app) geschrieben. Dieser Beitrag wird praktisch: eine spezifische, wirklich schmerzhafte Konvertierung — **DWG zu KMZ** — und genau, wie sie im Tool abläuft.

## Warum genau diese Konvertierung wehtut

DWG und KMZ leben in verschiedenen Universen, die ständig miteinander kommunizieren müssen:

- **DWG** ist AutoCADs natives Binärformat — die Lingua franca von Vermessern, Ingenieuren und Architekten.
- **KMZ** ist die gezippte Variante von KML, dem Format, das Google Earth (und Google Maps, und Google My Maps) nativ verarbeitet.

Sobald eine Bauzeichnung von einem Kunden, einer Gemeinde oder jemandem ohne CAD-Lizenz überprüft werden muss, landet das Gespräch unweigerlich bei „kannst du mir etwas schicken, das ich in Google Earth öffnen kann?“.

Die traditionellen Antworten sind alle unangenehm: Desktop-GIS- oder AutoCAD-Export-Workflows (Lizenz, Lernkurve), Kommandozeilen-`ogr2ogr` (okay, wenn du bereits weißt, dass es existiert), oder ein Online-Konverter — der deine Zeichnung still und leise auf den Server von jemand anderem hochlädt.

## Die Anleitung

Für diesen Test habe ich eine echte AutoCAD-Datei verwendet — `polyline2d_line_2007.dwg` aus der öffentlichen [nextgis/dwg_samples](https://github.com/nextgis/dwg_samples)-Testsammlung — sodass jeder Screenshot unten eine echte Konvertierung zeigt, kein Mockup.

### Schritt 1 — DWG hineinziehen

Gehe zum [format converter](https://geoo.app/tools/converter) und ziehe die Datei auf das Upload-Panel. Das Format wird automatisch als **AutoCAD DWG** erkannt:

![geoo.app converter with a DWG file loaded, source format auto-detected and a coordinate system notice](/images/geoo-app/dwg-to-kmz-step1.png)

Beachte die Warnung, die du bei vielen CAD-Dateien siehst: *„Could not detect the source coordinate system automatically.“* Das ist nicht das Tool, das Schwierigkeiten macht — das ist DWG, das ehrlich ist. Dazu gleich mehr, denn das ist das Wichtigste, was man verstehen muss, wenn CAD-Daten auf eine Karte übertragen werden.

### Schritt 2 — KMZ wählen und konvertieren

Wähle im Dropdown für das Zielformat **KMZ**. Klicke dann auf **Start Conversion**. Für eine Datei dieser Größe ist die Arbeit in wenigen Sekunden erledigt:

![converter showing KMZ selected as target format and a green Success badge after conversion](/images/geoo-app/dwg-to-kmz-step2.png)

Das grüne **Success**-Badge bedeutet, dass die Geometrie die Pipeline durchlaufen hat — als DWG gelesen, als GeoJSON im Speicher gehalten und zu KMZ serialisiert — alles im Browser-Tab.

### Schritt 3 — Vorschau vor dem Download

Das ist der Schritt, den die meisten Konverter auslassen. Klicke auf **Preview Result** und du erhältst eine Attributtabelle mit genau dem, was in deinem KMZ landen wird:

![data preview showing one converted feature in EPSG:4326 with layer, handle and color attributes preserved](/images/geoo-app/dwg-to-kmz-step3.png)

Hier erscheint die Polyline als **1 Feature** in **EPSG:4326 (WGS84)** — dem Koordinatensystem, das KMZ erfordert — und schau dir die Spalten an: `layer`, `handle`, `color`. Die CAD-Eigenschaften haben die Reise überlebt. Deine Layer und Objekt-Handles verdampfen nicht an der Formatgrenze; sie kommen als GIS-Attribute an, mit denen du auf der anderen Seite filtern und stylen kannst.

Zufrieden? **Download Result** und du hast eine `.kmz`, die du per Doppelklick direkt in Google Earth öffnen oder in My Maps importieren kannst.

## Die Realitätsprüfung des Koordinatensystems

Erinnerst du dich an die Warnung in Schritt 1? Hier ist die Lektion, die jeder CAD-zu-GIS-Reisende kennen muss.

Die meisten technischen Zeichnungen werden in **lokalen Projektkoordinaten** erstellt — willkürliche Ursprünge wie (0,0) irgendwo auf der Baustelle, oft in Metern. Geografische Formate wie KML/KMZ erfordern **WGS84-Länge/Breite**. Wenn niemand je aufgezeichnet hat, auf welches reale CRS sich die Zeichnung bezieht, kann kein Konverter der Welt sie magisch platzieren — die Daten sind einfach nicht in der Datei.

In der Praxis triffst du bei der Konvertierung von DWG zu KMZ auf eine von drei Situationen:

1. **Die Zeichnung ist bereits georeferenziert** (Vermessungszeichnungen sind das oft, in einem projizierten CRS wie einer UTM-Zone). Verwende die Koordinatensystem-Auswahl des Konverters — jeder EPSG-Code ist durchsuchbar — um das Quell-CRS zu deklarieren, und die Ausgabe wird korrekt nach WGS84 reprojeziert.
2. **Die Zeichnung ist in lokalen Koordinaten, aber du kennst den Anker.** Konvertiere die Geometrie und korrigiere dann die Platzierung — ein Koordinaten-Offset-Tool oder ein Georeferenzierungsschritt bringt die gesamte Zeichnung an ihren tatsächlichen Standort.
3. **Niemand weiß etwas.** Die Geometrie (Linien, Polylines, Blöcke) konvertiert trotzdem sauber — du findest sie nur im Atlantik nahe (0°, 0°) schwimmend, bis du sie platzierst. Für reinen Geometrie-Austausch — „prüfe diese Trasse“, „zähle diese Parzellen“ — ist das oft völlig in Ordnung.

Der Konverter sagt dir, in welcher Situation du bist, bevor du etwas herunterlädst. Genau für diese Transparenz existiert die Vorschau.

## Tipps für saubere CAD → KMZ-Ausgabe

- **Bereinigen vor dem Konvertieren.** Eingefrorene Konstruktionslinien und herumliegender Text explodieren die Feature-Anzahl ohne jeden Nutzen. Ein kurzer `PURGE`/`OVERKILL` in AutoCAD hält das KMZ schlank.
- **In Layern denken.** DWG-Layer werden zu GIS-Attributen (du hast `layer` in der Vorschau gesehen) — eine ordentliche Layer-Struktur wird zu einer ordentlichen, stilisierbaren Karte.
- **Kurven werden diskretisiert.** Bögen, Kreise und Splines werden bei der Konvertierung als Polylines angenähert, was Standardpraxis ist — erwarte nur nicht, dass Radius-Metadaten überleben.
- **Prüfe die Vorschautabelle, nicht nur das Success-Badge.** Dreißig Sekunden des Überprüfens von Feature-Anzahlen und Attributen sparen eine Stunde des „warum ist meine Zeichnung in Google Earth leer“.

## Fazit

DWG zu KMZ ist die Art von Konvertierung, die niemand aus Spaß macht — du machst sie, weil jemand die Zeichnung *sehen* muss. Mit [geoo.app](https://geoo.app/tools/converter) ist es jetzt eine Angelegenheit von dreißig Sekunden, ohne Installation, ohne Upload: hineinziehen, KMZ wählen, konvertieren, Vorschau, herunterladen. Und wenn deine Reise umgekehrt verläuft — KML zurück in CAD-Formate — deckt derselbe Konverter auch diese Richtung ab.

Neugierig auf die Toolbox, in der das steckt? Die ganze Geschichte habe ich in [Introducing geoo.app](/blog/introducing-geoo-app) behandelt.
