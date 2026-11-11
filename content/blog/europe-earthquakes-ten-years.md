---
title: "Europe’s Seismic Pulse: Ten Years of Earthquakes in One Wall"
description: "Explore 99,423 earthquakes across Europe and the Mediterranean from 2016–2025 as a day-by-zone pulse wall: rhythm, depth, and the 2023 rupture that released more energy than the other nine years combined."
date: "2026-11-10"
tags: ["data-visualization", "earthquakes", "gis", "seismology"]
featured: true
interactive: "europe-earthquakes-ten-years"
---

A dot map is very good at one thing: showing where earthquakes happen. It is very bad at showing how they happen. Plot ten years of European seismicity and the Mediterranean lights up in a smear of dots; Greece becomes a texture, Turkey becomes a blot, and the difference between a busy swarm and a single quiet rupture disappears.

This article turns the catalogue on its side. The main view uses **time and tectonic zone**: a wall of marks where every column is a day, every row is a seismic zone, and every mark is an event. Height shows the day’s largest magnitude; colour shows the mean depth. A heat-map tab at the top keeps the geography as a density field — every event binned into a quarter-degree cell and coloured by energy or count — so you get the map without the dot-splat problem.

The dataset is the EMSC Euro-Mediterranean catalogue: **99,423 earthquakes of magnitude 2.5 or larger**, from **2016 through 2025**, between 34–72°N and 25°W–45°E. That box includes Turkey, the Caucasus, and the North African margin, so “Europe” here is shorthand for Europe and its Mediterranean neighbourhood.

<!-- interactive:europe-earthquakes-ten-years -->

## Why not a dot map?

Ten years is long enough for patterns to emerge, but a map collapses all of that time into one frame. Two events a decade apart sit on top of each other. A magnitude 7.8 and a magnitude 2.5 are both just dots. Depth, which separates a shallow crustal rupture from a slab earthquake 130 kilometres down, is usually encoded as a colour nobody can read.

The pulse wall keeps those dimensions separate. The horizontal axis is continuous time, so sequences and quiet periods stay visible. The vertical axis groups events by zone, so you can compare Greece’s drumbeat with Iceland’s sparse ticks. Height is magnitude, which is already a logarithmic scale, and colour is depth.

The trade-off is deliberate: the wall itself is not a locator map. If you need to place a zone, switch to the heat-map tab, which re-casts the same catalogue as a geographic density field (energy or event count per quarter-degree cell). The heat map can also replay the decade year by year — press play and watch Anatolia flare in 2023. You will not find your town on it, but you see exactly where the continent is speaking and how loud.

## Read the wall

The first thing the wall shows is inequality. **Greece accounts for 33,220 events, about one third of the entire catalogue.** Western Turkey adds 16,263 and Anatolia and the Caucasus add 18,358. Those three rows are where the catalogue is dense enough to look like a continuous fabric. Romania, France, the Alps, and the North European row are mostly thin, interrupted lines.

The second thing it shows is rhythm. Greece is not one event followed by silence; it is a nearly continuous background with recurring bursts. Iceland is the opposite: long gaps, then a sharp cluster such as the M6.8 Jan Mayen event in November 2018. The 2020 M7.0 Samos earthquake appears as a single tall mark in the Greece row after a comparatively quiet stretch.

The interactive wall lets you test those impressions. Hover over a day to see the count, largest magnitude, and mean depth for that zone. Click to pin the day. Drag across a range to zoom, then use **10 years**, **Year**, or **Month** to move between scales. **Play the decade** sweeps a playhead across the current view. Click a zone chip, or a zone label, to isolate one row.

## The second population

The depth panel is where the wall becomes an argument rather than a picture. Most European earthquakes are shallow: the Aegean, the Italian Apennines, and the Anatolian faults all release stress in the upper crust. Greece has 33,220 events but only about 2% below 70 kilometres.

Romania is different. Of its 2,059 events, **1,549 — about 75% — are deeper than 70 kilometres**, with a clear second peak around 125–130 kilometres. That is the Vrancea slab: a narrow, dense body of intermediate-depth earthquakes under the Carpathian bend, separated from the shallow crustal events above it. In the depth panel, the Romanian row has two distinct dark bands instead of one.

Italy has a smaller but still visible deep population: 654 events below 70 kilometres, including 75 deeper than 300 kilometres under the Tyrrhenian Sea. Those are slab earthquakes, not shallow fault ruptures. The same map colour would have hidden them.

## The year that shouted

The energy ledger makes the decade’s imbalance explicit. Using the Gutenberg–Richter approximation, log₁₀E = 4.8 + 1.5M, the catalogue represents about **57.6 petajoules** of released energy. **2023 alone accounts for 44.6 PJ, roughly 3.4 times the other nine years combined.**

That is not a subtle statistical effect. The M7.8 and M7.5 ruptures in central Turkey on 6 February 2023, plus their aftershock sequence, dominate the year. The single busiest day in the catalogue is that day: 419 events of M2.5 or larger in the box, with the two largest at 01:17 and 10:24 UTC.

The ledger lets you remove 2023 from the scale and look at the remaining nine years. The bars for 2020 and 2018 become visible; 2024 becomes the quietest year by energy; the decade starts to look less like a steady trend and more like a sequence of occasional ruptures separated by ordinary background activity.

Energy is not the same as impact. A shallow magnitude 6 near a city can matter more than a deeper magnitude 7 offshore. The ledger is a way to compare the catalogue’s physical output, not a ranking of disasters.

## What the catalogue can and cannot say

The wall is only as good as its catalogue, so a few limits belong next to the picture.

**Completeness is uneven.** EMSC’s Euro-Mediterranean network is dense over Greece, Italy, Turkey, and the Balkans, and much sparser over the Atlantic and North Africa. A blank stretch in the Azores row does not prove there were no earthquakes; it may mean no station recorded a small one. The M2.5 threshold is a compromise between coverage and volume.

**Magnitude types are mixed.** Most events here use ML (90,858), with smaller numbers of M, mb, Mw, and other types. Mixing magnitude scales adds uncertainty, especially near the threshold. The largest events are the least affected, but the small-event texture is not a homogeneous measurement.

**Depth is uncertain.** A few records report 600–750 kilometres under Syria, central Turkey, and the Black Sea. Those are probably depth-phase or catalogue artefacts rather than real mantle earthquakes; they are grouped into the 300+ bin and do not drive the main reading. Vrancea’s 90–160 kilometre cluster is a much more robust feature.

**Aftershocks are counted individually.** The 2023 bar is large partly because the catalogue contains thousands of aftershocks. Counting events and summing energy answer different questions: one measures how often the ground moved, the other how much energy was released.

**“Europe” is a shorthand.** The box includes Turkey, the Caucasus, and the northern edge of Africa. Excluding Turkey would remove the decade’s largest rupture and make the wall look calmer than the region actually is. The scope is stated here rather than hidden in the axis.

## Reproduce it

The browser never downloads the 99,423 raw events. A build script fetches the EMSC catalogue in yearly chunks, normalises the region names, assigns each event to one of 13 zones, and writes four small aggregates: a day-by-zone matrix, a zone-by-depth histogram, a list of notable events, and metadata. The page loads the aggregates and renders the wall on a canvas.

- Source catalogue: [EMSC Seismic Portal FDSN event service](https://www.seismicportal.eu/fdsnws/event/1/)
- Scope: 2016-01-01 to 2026-01-01, M≥2.5, 34–72°N, 25°W–45°E
- Events after cleaning: 99,423 (31 records without a usable magnitude or timestamp were dropped)
- Zones: 13, assigned from EMSC’s `flynn_region` field with a nearest-centroid fallback
- Energy: derived from magnitude, not measured radiated energy
- Data generated: 2026-11-10

EMSC data are open access; credit the European Mediterranean Seismological Centre. The aggregation scripts live in `scripts/fetch-earthquakes.mjs` and `scripts/build-earthquake-data.mjs` in the site repository.

The point of the wall is not that it replaces maps. It is that a map is one projection of a catalogue, and sometimes the most useful projection is the one that keeps time, depth, and rhythm intact.
