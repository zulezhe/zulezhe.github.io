---
title: "Hong Kong’s Public Charging Network: 990 Places to Plug In"
description: "All 990 public charging locations and 18,202 chargers registered with Hong Kong’s EPD, broken down by district and charging class — where fast charging clusters, which districts still lean on 13A sockets, and how the same question reshapes itself across 1,114 km² when read against 48 European countries."
date: "2026-11-12"
tags: ["ev-charging", "gis", "data-visualization", "hong-kong"]
featured: true
interactive: "hk-ev-charging"
---

My last charging-network analysis [mapped 275,402 charging stations across 48 European countries](/blog/ev-charging-europe/). There the question was distance: how far apart two fast chargers sit. This time I bring the same question home to Hong Kong. The whole city covers 1,114 km², and in theory no point is more than an hour’s drive from any other. Distance is not the variable here; districts, building age and car-park management are.

The data comes from the Environmental Protection Department’s *Electric Vehicle Chargers for Public Access* dataset, registered by public and private operators and refreshed quarterly. This snapshot records **990 public charging locations with 18,202 chargers in total**. Every location carries its District Council district and lists counts in three classes: standard (13A slow), medium (AC), and quick/fast (DC). The interactive below filters by class and district; click any circle for that location’s breakdown.

<!-- interactive:hk-ev-charging -->

## All 18 districts have chargers, but the spread is sevenfold

First, the baseline: every one of Hong Kong’s 18 District Council districts has public chargers. Spread them out, though, and Kowloon City has 2,497 chargers while Tai Po has 357 — a sevenfold gap.

Location counts and charger counts need to be read separately. **Kwun Tong leads with 116 locations**, but its charger total (2,314) ranks second; Kowloon City has only 40 locations yet takes first place with 2,497 chargers. The reason is not hard to guess: Kai Tak. This still-expanding reclamation district straddles the Kowloon City–Kwun Tong boundary, and its new car parks keep getting bigger — Airside alone registers 855 chargers, The Quayside 422, and the two towers of The Twins around 600 between them. What is the citywide median? **7 chargers per location**. The mean is 18.4. A handful of giant locations pulling the mean up while most stay ordinary is a shape anyone who read the Europe post will recognise — the station-to-point distributions in France and Germany tell the same story.

## Where did the slow sockets go

Split by class, the city’s 18,202 chargers break down into 2,834 standard 13A slow sockets (15.6%), 11,609 medium AC (63.8%), and 3,759 DC fast chargers (20.7%).

The distribution of the standard sockets is the interesting part. They are almost all in one place: **Kowloon City alone has 1,116, or 39% of the citywide total** — more than a thousand of them from the large new car parks at Kai Tak. Meanwhile Yau Tsim Mong has just 9 standard chargers district-wide, Southern 2, and Tuen Mun 3. This is no coincidence. Car parks in the old districts were laid out decades ago; retrofitting a slow-charging bay rarely pays for the cost and space, so going straight to medium or fast charging makes more sense. New districts get car parks planned floor by floor, where a hundred-plus 13A sockets can go in as rows for owners to use slowly overnight.

Put another way, **Hong Kong’s slow sockets are not in ordinary housing estates; they are in Kai Tak’s showcase car parks**. For a city where most people live in towers with no private bay to charge in overnight, that distribution reads a little oddly.

## Where fast charging concentrates

The 3,759 DC fast chargers sit across 542 locations — **55% of the city’s public charging locations offer fast charging**. Spread over land area, that is about 3.4 DC fast chargers per km².

By district, Sha Tin leads with 429 fast chargers, followed by Kwun Tong on 364 and Yau Tsim Mong on 358. Switch the map to **Fast (DC)** and the circles shift from blue to red with each location’s fast-charging share: Yau Tsim Mong and Central & Western turn almost entirely, since public chargers in these commercial cores are nearly all medium or fast with the slow share close to zero, while most New Territories districts stay blue, where slow sockets still make up the base.

## The Europe comparison, with real numbers

Rather than trade generalities, this one inserts Hong Kong as the 49th registry into the Europe post’s data and lets it take its place in the ranking — the panel above switches between three metrics and puts all 49 registries side by side.

**First, total volume** — Hong Kong’s 18,202 charge points rank 8th of 49, behind France (260,694), Germany (209,136), Spain, the United Kingdom, Sweden, Norway and Italy, and ahead of the Netherlands’ 12,759. A city of 7.5 million people registers more public charge points than any Nordic country. Of course, registry coverage varies enormously — Germany and France register far more completely than the Netherlands — so read this as an order of magnitude, not a league table.

**The shape is where it gets interesting** — by median charge points per station, Hong Kong ranks 1st with 7: Norway and Sweden sit at 4, France, Germany, Italy and Spain at 2, the Netherlands and the United Kingdom at just 1. The mean is starker still: Hong Kong 18.4, the highest in Europe is Norway at 6.2, and the Europe-wide average is 2.7. Half of this is registration rules: Germany logs one record per post, France groups several posts into one station, Hong Kong registers by car park. The other half is the physical world: Europe’s norm is one or two slow posts at the roadside, Hong Kong’s is a whole row inside a car park — Airside alone registers 855 chargers, and no European country’s average station comes close to that scale.

**The fast-charging share holds up** — Hong Kong’s 20.7% puts 21 of the 48 European registries above it and 27 below; the Europe-wide figure (≥50 kW) is 24.8%. The Netherlands, with its dense low-power points, has a fast-charging share of only 12.5% — plenty of charge points and plenty of fast chargers are two different things in Europe too.

Europe’s real problem does not exist here. That post measured a median distance of 0.81 km from low-power stations to the nearest fast charger, with 324 origins beyond 50 km — distance is Europe’s scarce resource. Hong Kong is a 45-minute drive end to end, so distance is never the variable; behind the 990 locations, the scarce thing is the parking space itself. The city has over 100,000 electric private cars; most charging happens in private bays, and the public network is only a supplement.

Per-km² density is deliberately left out this time: the Europe snapshot registers only 8,144 stations in the Netherlands, so dividing by land area would compare registration completeness, not infrastructure density. Station counts and point counts, registration rules and coverage, always have to be read together — that was the Europe post’s ending, and it is this one’s too.

## Sources and limits

The snapshot was generated on 12 November 2026 from the EPD’s *Electric Vehicle Chargers for Public Access* dataset (DATA.GOV.HK / CSDI platform, GeoJSON API). It is refreshed quarterly, covers chargers made available to the public by government and private operators, and excludes dedicated bays in private housing estates.

Classes follow the dataset’s own fields: standard (13A), medium (including medium CCS DC), quick and fast. This article merges the quick and fast DC tiers into one fast-charging class; the dataset’s 6 medium CCS DC records are counted as medium. Locations with zero in all three classes were removed, coordinates were range-checked, and no outliers were found. Utilisation, live status and queueing are outside the data — a registered count is not the same as availability.

The Europe comparison comes from that post’s lossless station snapshot (stations.csv, 48 countries and territories, 275,402 stations, 753,603 charge points, generated 20 October 2026). Only three registration-basis metrics are used: total registered points, points per station, and the share rated ≥50 kW (power class 3). Hong Kong’s fast-charging share uses the EPD quick+fast basis; the two definitions are not identical, so the comparison is approximate. Neither dataset supports per-km² density — coverage differs too much between countries for that number to mean anything.

- [EPD Electric Vehicle Chargers for Public Access (DATA.GOV.HK)](https://data.gov.hk/en-data/dataset/hk-epd-evcpateam-evc-1)
- [Europe’s EV Charging Network: The Distance Behind the Dots](/blog/ev-charging-europe/)
