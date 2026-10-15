---
title: "Introducing geoo.app: 600+ Free GIS Tools That Run Entirely in Your Browser"
description: "I built a browser-based GIS toolbox — format conversion, coordinate transforms, raster processing and more — where every byte is processed locally with WebAssembly. No installs, no uploads, no accounts."
date: "2026-10-15"
tags: ["gis", "webassembly", "projects"]
featured: true
faq:
  - q: "Is geoo.app really free?"
    a: "Yes. Every tool is free with no sign-up, no watermarks, and no daily limits. The only ceiling is your device's memory — file size limits exist because of the browser, not a paywall."
  - q: "Do my files get uploaded to a server?"
    a: "No. All processing runs in your browser via WebAssembly and JavaScript. Files never leave your device, and memory is cleared when you close the tab. That makes it safe for confidential or commercial geospatial data."
  - q: "How large can my files be?"
    a: "Most formats work up to roughly 500 MB, with zipped Shapefiles supported up to 200 MB. Stream-based parsing keeps the browser responsive even on large files."
  - q: "Which formats and coordinate systems are supported?"
    a: "Over 30 formats including GeoJSON, Shapefile, KML/KMZ, GPX, CSV, TopoJSON, DXF, DWG, GeoPackage, GeoTIFF and WKT — more than 500 conversion combinations. Coordinates cover WGS84, Web Mercator, every UTM zone, GCJ-02/BD-09, and thousands of CRSs searchable by EPSG code."
---

**TL;DR:** I've been building [geoo.app](https://geoo.app) — a free, browser-based GIS toolbox with 600+ tools for format conversion, coordinate transformation, raster processing and visualization. Everything runs locally via WebAssembly, so your files never leave your device. No installs, no accounts, no uploads. In this post: why I built it, how it works under the hood, and what it can do for you.

## The problem with geospatial tooling

If you've worked with geographic data, this story will feel familiar.

You get a `.dwg` from a client that needs to become GeoJSON. Or a Shapefile in a local projected CRS that needs to move to WGS84. The "professional" answer is desktop GIS software — powerful, but expensive, Windows-centric, and a 2 GB download for what is fundamentally a 5 MB conversion job.

The "quick" answer is one of the online converters. Then you read the fine print: your file gets uploaded to somebody's server, processed who-knows-where, and retained who-knows-how-long. For survey data, client boundaries, or anything commercial, that's not a trade-off you should have to make.

And the command-line answer — GDAL, PROJ, a pipeline of `ogr2ogr` incantations — is great if you live in a terminal, but plenty of people who work with maps don't, and shouldn't have to.

I kept thinking: modern browsers can compile and run C++ at near-native speed. The conversion logic isn't the hard part — GDAL has existed for decades. So why does every "online converter" still want my file?

That question became [geoo.app](https://geoo.app).

## What geoo.app does

At its core it's a suite of 600+ tools organized around the jobs GIS data actually needs done:

![geoo.app homepage: 600+ free online GIS tools with local, no-upload processing](/images/geoo-app/home.png)

*The geoo.app landing page — the whole value proposition in one screen: free, unlimited, and 100% local processing.*

- **Format conversion** — over 500 conversion combinations across 30+ formats: GeoJSON, Shapefile, KML/KMZ, GPX, CSV, TopoJSON, DXF, DWG, GeoPackage, GeoTIFF, WKT and friends. Batch conversion included.
- **Coordinate transformation** — WGS84, Web Mercator, all UTM zones, thousands of CRSs searchable by EPSG code, plus the Chinese GCJ-02 and BD-09 systems, with batch processing.
- **Raster processing** — format conversion, clipping, reprojection and band operations, including direct GeoTIFF work.
- **Viewers & visualization** — interactive map preview of your data, no setup required.
- **Workflow** — chain multiple operations together, so "convert → reproject → clip" is one flow instead of three round-trips.
- **Georeferencer** — bring un-referenced imagery onto real-world coordinates.
- **Geocoding** — forward and reverse, including batch geocoding of CSV address lists (via OpenStreetMap's Nominatim).

![geoo.app format converter: drag-and-drop panel with GPX, KML, SHP, DWG, DXF, GeoJSON format chips](/images/geoo-app/converter.png)

*The universal converter — drop a file, pick a target format, and it's processed on your machine. The format chips read like a GIS conference attendee list.*

The whole thing is free: no sign-up, no watermarks, no daily limits, no "large files are a paid feature." The interface ships in 11 languages.

## How it works: privacy as architecture

The headline feature isn't any single tool — it's that **your files never leave your device**. Not "we delete them after 24 hours." They are simply never uploaded, because there is no upload.

That works because the heavy lifting runs in the browser:

- **GDAL/OGR compiled to WebAssembly** powers the format and raster engines — the same battle-tested library behind most desktop GIS pipelines, executing locally on your machine.
- **Stream-based parsing** handles large files (hundreds of megabytes) without freezing the tab — data flows through the parser instead of loading wholesale into memory.
- **Open-source geospatial libraries** fill the gaps: proj4js and its CRS database for coordinate math, shpjs for Shapefile reading, @tmcw/togeojson for XML formats. I'd rather stand on these shoulders than reinvent twenty years of format edge cases.

When you close the tab, the data is gone. For anyone handling confidential surveys, client boundaries, or commercial datasets, "your data stays on your device" isn't a privacy policy — it's the architecture.

## Who it's for

- **GIS professionals** who need a quick conversion without spinning up desktop software
- **Surveyors and consultants** whose data can't legally or contractually touch third-party servers
- **Developers** cleaning up data before it hits PostGIS or a web map
- **Students and researchers** who just need KML to GeoJSON *right now*, not after creating an account

## Try it

Head to [geoo.app](https://geoo.app) — pick a tool, drop a file, and watch it process locally. If you work with geographic data, I'd genuinely love to hear what's missing; the roadmap is driven almost entirely by user requests. And if you're curious about the static-site side of my projects, take a look at [how this blog is built](/blog/how-this-site-is-built) — the two make a nice contrast: one pushes everything serverless, the other pushes everything browser-side.
