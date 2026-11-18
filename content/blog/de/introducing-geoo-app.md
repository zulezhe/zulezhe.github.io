---
title: "# Vorstellung von geoo.app: Über 600 kostenlose GIS-Tools, die vollständig in Ihrem Browser laufen"
description: "Ich habe ein browserbasiertes GIS-Werkzeugkasten gebaut — Formatkonvertierung, Koordinatentransformationen, Rasterverarbeitung und mehr — bei dem jedes Byte lokal mit WebAssembly verarbeitet wird. Keine Installationen, keine Uploads, keine Konten."
date: "2026-10-15"
tags: ["gis","webassembly","projects"]
featured: true
faq: [{"q":"Is geoo.app really free?","a":"Yes. Every tool is free with no sign-up, no watermarks, and no daily limits. The only ceiling is your device's memory — file size limits exist because of the browser, not a paywall."},{"q":"Do my files get uploaded to a server?","a":"No. All processing runs in your browser via WebAssembly and JavaScript. Files never leave your device, and memory is cleared when you close the tab. That makes it safe for confidential or commercial geospatial data."},{"q":"How large can my files be?","a":"Most formats work up to roughly 500 MB, with zipped Shapefiles supported up to 200 MB. Stream-based parsing keeps the browser responsive even on large files."},{"q":"Which formats and coordinate systems are supported?","a":"Over 30 formats including GeoJSON, Shapefile, KML/KMZ, GPX, CSV, TopoJSON, DXF, DWG, GeoPackage, GeoTIFF and WKT — more than 500 conversion combinations. Coordinates cover WGS84, Web Mercator, every UTM zone, GCJ-02/BD-09, and thousands of CRSs searchable by EPSG code."}]
translationOf: "introducing-geoo-app"
---

**TL;DR:** Ich habe [geoo.app](https://geoo.app) entwickelt — eine kostenlose, browserbasierte GIS-Toolbox mit über 600 Werkzeugen für Formatkonvertierung, Koordinatentransformation, Rasterverarbeitung und Visualisierung. Alles läuft lokal per WebAssembly, sodass Ihre Dateien niemals Ihr Gerät verlassen. Keine Installationen, keine Konten, keine Uploads. In diesem Beitrag: warum ich es gebaut habe, wie es unter der Haube funktioniert und was es für Sie tun kann.

## Das Problem mit Geodaten-Werkzeugen

Wenn Sie mit Geodaten gearbeitet haben, kommt Ihnen diese Geschichte bekannt vor.

Sie erhalten eine `.dwg` von einem Kunden, die als GeoJSON benötigt wird. Oder ein Shapefile in einem lokal projizierten CRS, das nach WGS84 überführt werden muss. Die „professionelle“ Antwort ist Desktop-GIS-Software — mächtig, aber teuer, Windows-zentriert, und ein 2-GB-Download für eine im Grunde 5 MB große Konvertierungsaufgabe.

Die „schnelle“ Antwort ist einer der Online-Konverter. Dann lesen Sie das Kleingedruckte: Ihre Datei wird auf den Server eines Dritten hochgeladen, verarbeitet, wo auch immer, und so lange aufbewahrt, wie es niemand weiß. Bei Vermessungsdaten, Kundengrenzen oder allem Kommerziellen ist das ein Kompromiss, den Sie eingehen shouldn't müssen.

Und die Kommandozeilen-Antwort — GDAL, PROJ, eine Abfolge von `ogr2ogr`-Beschwörungsformeln — ist großartig, wenn Sie im Terminal leben, aber viele Menschen, die mit Karten arbeiten, tun das nicht — und sollten es auch nicht müssen.

Ich habe mir immer wieder gedacht: Moderne Browser können C++ mit nahezu nativer Geschwindigkeit kompilieren und ausführen. Die Konvertierungslogik ist nicht der schwierige Teil — GDAL existiert seit Jahrzehnten. Warum will also jeder „Online-Konverter“ immer noch meine Datei?

Diese Frage wurde zu [geoo.app](https://geoo.app).

## Was geoo.app kann

Im Kern handelt es sich um eine Suite von über 600 Werkzeugen, organisiert rund um die Aufgaben, die GIS-Daten tatsächlich erledigt bekommen müssen:

![geoo.app homepage: 600+ free online GIS tools with local, no-upload processing](/images/geoo-app/home.png)

*Die geoo.app-Landingpage — das gesamte Wertversprechen auf einem Bildschirm: kostenlos, unbegrenzt und 100 % lokale Verarbeitung.*

- **Formatkonvertierung** — über 500 Konvertierungskombinationen in mehr als 30 Formaten: GeoJSON, Shapefile, KML/KMZ, GPX, CSV, TopoJSON, DXF, DWG, GeoPackage, GeoTIFF, WKT und mehr. Inklusive Batch-Konvertierung.
- **Koordinatentransformation** — WGS84, Web Mercator, alle UTM-Zonen, tausende CRSs, durchsuchbar nach EPSG-Code, dazu die chinesischen Systeme GCJ-02 und BD-09, mit Batch-Verarbeitung.
- **Rasterverarbeitung** — Formatkonvertierung, Clipping, Reprojektion und Band-Operationen, einschließlich direkter GeoTIFF-Arbeit.
- **Viewer & Visualisierung** — interaktive Kartenvorschau Ihrer Daten, ganz ohne Einrichtung.
- **Workflow** — mehrere Operationen verketten, sodass „konvertieren → reprojizieren → clippen“ ein einziger Ablauf ist, statt drei Hin-und-her-Runden.
- **Georeferenzierung** — referenzlose Bilddaten auf reale Koordinaten bringen.
- **Geocoding** — vorwärts und rückwärts, einschließlich Batch-Geocoding von CSV-Adresslisten (über Nominatim von OpenStreetMap).

![geoo.app format converter: drag-and-drop panel with GPX, KML, SHP, DWG, DXF, GeoJSON format chips](/images/geoo-app/converter.png)

*Der universelle Konverter — Datei ablegen, Zielformat wählen, und die Verarbeitung erfolgt auf Ihrem Rechner. Die Format-Chips lesen sich wie die Teilnehmerliste einer GIS-Konferenz.*

Das Ganze ist kostenlos: keine Anmeldung, keine Wasserzeichen, keine Tageslimits, kein „Große Dateien sind ein Bezahlfeature“. Die Oberfläche gibt es in 9 Sprachen.

## Wie es funktioniert: Datenschutz als Architektur

Das herausragende Feature ist kein einzelnes Werkzeug — sondern dass **Ihre Dateien niemals Ihr Gerät verlassen**. Nicht „wir löschen sie nach 24 Stunden“. Sie werden schlicht nie hochgeladen, weil es keinen Upload gibt.

Das funktioniert, weil die schweren Berechnungen im Browser laufen:

- **GDAL/OGR, kompiliert zu WebAssembly**, treibt die Format- und Raster-Engines an — dieselbe bewährte Bibliothek, die hinter den meisten Desktop-GIS-Pipelines steckt, lokal auf Ihrem Rechner ausgeführt.
- **Stream-basiertes Parsen** verarbeitet große Dateien (Hunderte von Megabytes), ohne den Tab einzufrieren — die Daten fließen durch den Parser, statt vollständig in den Speicher geladen zu werden.
- **Open-Source-Geodaten-Bibliotheken** füllen die Lücken: proj4js mit seiner CRS-Datenbank für Koordinatenmathematik, shpjs zum Lesen von Shapefiles, @tmcw/togeojson für XML-Formate. Lieber stehe ich auf diesen Schultern, als zwanzig Jahre an Formate-Randfällen neu zu erfinden.

Sobald Sie den Tab schließen, sind die Daten weg. Für alle, die mit vertraulichen Vermessungen, Kundengrenzen oder kommerziellen Datensätzen arbeiten, ist „Ihre Daten bleiben auf Ihrem Gerät“ keine Datenschutzerklärung — es ist die Architektur.

## Für wen es gedacht ist

- **GIS-Fachleute**, die eine schnelle Konvertierung brauchen, ohne Desktop-Software zu starten
- **Vermesser und Berater**, deren Daten aus rechtlichen oder vertraglichen Gründen keine Server von Drittanbietern berühren dürfen
- **Entwickler**, die Daten bereinigen, bevor sie in PostGIS oder eine Webkarte landen
- **Studierende und Forschende**, die KML zu GeoJSON einfach *jetzt* brauchen — nicht erst nach der Erstellung eines Kontos

## Ausprobieren

Besuchen Sie [geoo.app](https://geoo.app) — wählen Sie ein Werkzeug, legen Sie eine Datei ab und sehen Sie zu, wie sie lokal verarbeitet wird. Wenn Sie mit Geodaten arbeiten, würde ich wirklich gerne hören, was noch fehlt; die Roadmap wird fast vollständig durch Nutzeranfragen bestimmt. Und falls Sie neugierig auf die Static-Site-Seite meiner Projekte sind, werfen Sie einen Blick auf [how this blog is built](/blog/how-this-site-is-built) — die beiden bilden einen schönen Kontrast: das eine verlagert alles auf Serverless, das andere verlagert alles in den Browser.
