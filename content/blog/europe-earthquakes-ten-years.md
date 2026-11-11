---
title: "Europe’s Seismic Pulse: Ten Years of Earthquakes, Read Through the Data"
description: "99,423 European earthquakes, 2016–2025. A data-led read of where the continent trembles, why Romania shakes deep while Greece shakes shallow, and how one day in 2023 released more energy than the other nine years combined."
date: "2026-11-10"
tags: ["earthquakes", "gis", "seismology", "data-analysis"]
featured: true
interactive: "europe-earthquakes-ten-years"
---

Europe is one of the most seismically active corners of the planet — and not because of a single fault. It sits at the slow-motion collision where Africa pushes north into Eurasia, the Atlantic ridge pulls Iceland apart, and the Mediterranean is the crumple zone between them. Over ten years that machinery produced **99,423 recorded earthquakes of magnitude 2.5 or larger**.

This article reads that decade through the catalogue itself. Below is an interactive that lets you walk through it: a **pulse wall** where every column is a day and every row is a seismic zone, a **depth panel** that separates shallow crustal ruptures from deep slab events, a **heat map** of where the energy landed, and an **energy ledger** that sums the decade. The data come from the EMSC Euro-Mediterranean catalogue, 2016–2025, boxed to 34–72°N and 25°W–45°E — which is why "Europe" here also takes in Turkey, the Caucasus, and the North African margin.

<!-- interactive:europe-earthquakes-ten-years -->

## Where the continent trembles

The first thing the catalogue makes plain is how concentrated European seismicity is. **Greece and its Hellenic arc account for 33,220 events — about a third of the entire decade.** Add western Turkey (16,263) and the Anatolia–Caucasus belt (18,358) and roughly two-thirds of all recorded earthquakes sit in a thin arc running from the Ionian Sea to the Caspian.

That arc is not arbitrary. It traces the boundary where the African plate dives beneath Eurasia. Greece rides the overriding edge; Turkey is being squeezed westward between that subduction and the Arabian push; and the result is a near-continuous drumbeat of small ruptures. In the wall, the Greek row looks like fabric — event after event, day after day — while the North European row, the Alps, and France are mostly thin, broken lines: a continent that is, for the most part, still.

The heat map makes the same point geographically. Switch to it and the Mediterranean rim glows while the continental interior stays black. The only bright spots away from the rim are Iberia's offshore boundary and a faint scatter over the mid-Atlantic — Iceland's ridge, three thousand kilometres from Athens.

## Two kinds of deep earthquake

Depth is the dimension that turns the charts from description into interpretation, because it separates fundamentally different tectonic machines. Most European earthquakes are shallow: the Aegean, the Italian Apennines, and the Anatolian faults all release stress in the upper crust. Of Greece's 33,220 events, only about 2% occur below 70 kilometres.

Romania is the exception that proves the rule. Of its 2,059 events, **1,549 — roughly 75% — are deeper than 70 kilometres**, clustered tightly around 125–130 km. That is the Vrancea slab: a narrow body of intermediate-depth earthquakes wedged beneath the Carpathian bend, the remnant of old ocean floor that never quite finished subducting. No other part of Europe behaves like this. In the depth panel the Romanian row shows two clean bands — shallow crustal noise above, the slab below — where every other row is a single shallow smear.

Italy carries a smaller but genuine version of the same story. **654 of its events sit below 70 km, and 75 of those plunge deeper than 300 km under the Tyrrhenian Sea** — true slab earthquakes, not the shallow Apennine ruptures that make the headlines. A conventional map, where depth is just another colour, would have buried them.

## The rhythm of the decade

Strip away the geography and look only at time, and each zone reveals its own character. Greece is never silent: a steady background with recurring bursts. Iceland is the opposite — long quiet stretches broken by sharp clusters, such as the M6.8 Jan Mayen event of November 2018. And some years carry a single defining mark: the 2020 M7.0 Samos earthquake stands as one tall spike in the Greek row after a comparatively calm stretch.

The wall lets you feel these rhythms directly. Drag across a range to zoom from a decade down to a single month; click a zone chip to isolate its row; press **Play the decade** and the whole catalogue sweeps past in real time. Hover any day to see that zone's count, largest magnitude, and mean depth.

## The year that shouted

For all the texture in the wall, the decade's single loudest signal is an imbalance. Using the Gutenberg–Richter relation (log₁₀E = 4.8 + 1.5M), the catalogue totals about **57.6 petajoules** of released energy — and **2023 alone accounts for 44.6 PJ, roughly 3.4 times the other nine years combined.**

That spike is the 6 February 2023 doublet: the M7.8 and M7.5 ruptures across central Turkey and their aftershock sequence. The busiest single day in the entire catalogue is that one — 419 events of M2.5 or larger in the box, the two largest at 01:17 and 10:24 UTC. The heat map, played year by year, shows Anatolia flare orange in 2023 while the rest of the decade stays comparatively dim.

Take 2023 away and the ledger looks different. The bars for 2018 and 2020 become visible; 2024 becomes the quietest year by energy. The decade stops looking like a trend and starts looking like what it is: a long stretch of ordinary background activity punctuated by one enormous release.

Energy is not the same as impact, of course. A shallow M6 near a city can matter more than a deeper M7 offshore. The ledger compares the catalogue's physical output, not the scale of any disaster.

## What the data does and doesn't capture

A few honest limits belong next to these readings. EMSC's network is dense over Greece, Italy, Turkey, and the Balkans but sparse over the Atlantic and North Africa, so a quiet Azores row is as likely a coverage gap as real calm. Magnitude types are mixed — mostly ML, with smaller counts of mb, Mw, and others — which matters most near the M2.5 threshold. And the catalogue counts aftershocks individually, which is exactly why 2023 looms so large: those thousands of aftershocks are real events but answer a different question from summed energy.

## Data and method

The browser loads four aggregates rather than the 99,423 raw events: a day-by-zone matrix, a zone-by-depth histogram, notable events, and metadata. A build script fetches EMSC in yearly chunks, normalises region names, assigns each event to one of 13 zones via `flynn_region` with a nearest-centroid fallback, and writes the aggregates the page renders. 31 records without a usable magnitude or timestamp were dropped; energy is derived from magnitude, not measured radiated energy. Source: [EMSC Seismic Portal FDSN event service](https://www.seismicportal.eu/fdsnws/event/1/). Data generated 2026-11-10.
