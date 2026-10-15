---
title: "geoo.app"
tagline: "600+ free GIS tools that run entirely in your browser — convert, reproject and visualize geospatial data without uploading a single byte."
description: "A privacy-first, browser-based GIS toolbox: format conversion, coordinate transformation, raster processing and visualization, all running locally via WebAssembly."
date: "2026-10-15"
tech: ["WebAssembly", "GDAL", "JavaScript", "proj4js", "shpjs"]
links:
  demo: "https://geoo.app"
featured: true
order: 1
---

## What it is

[geoo.app](https://geoo.app) is a free, browser-based geospatial toolbox — 600+ tools covering the jobs GIS data actually needs done, with zero installs and zero accounts.

## The problem

Every "online GIS converter" asks you to upload your data to somebody's server. Desktop GIS asks for a license and a 2 GB install for a 5 MB job. geoo.app refuses both trade-offs: the conversion engine ships to *you*, and your files never leave your device.

## Highlights

- **500+ conversion combinations** across 30+ formats — GeoJSON, Shapefile, KML/KMZ, GPX, CSV, TopoJSON, DXF, DWG, GeoPackage, GeoTIFF, WKT, and more
- **Coordinate transforms** for thousands of CRSs (searchable by EPSG code), all UTM zones, and the Chinese GCJ-02 / BD-09 systems, with batch processing
- **Raster toolkit** — format conversion, clipping, reprojection, band operations
- **Workflow chaining** — combine convert → reproject → clip into one flow
- **Viewers, a georeferencer, and batch CSV geocoding** (via OpenStreetMap's Nominatim)
- Stream-based parsing keeps files of hundreds of MB responsive; interface in 11 languages

## How it's built

GDAL/OGR compiled to WebAssembly does the heavy lifting in-browser, backed by open-source geospatial libraries (proj4js, shpjs, @tmcw/togeojson). Stream-based parsing avoids loading whole files into memory. There is no processing server — which is why "your data never leaves your device" is an architectural guarantee, not a privacy promise.

Read the launch post: [Introducing geoo.app](/blog/introducing-geoo-app).
