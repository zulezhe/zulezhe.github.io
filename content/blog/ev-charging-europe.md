---
title: "Europe’s EV Charging Network: The Distance Behind the Dots"
description: "Explore 275,402 charging-station records across 48 European countries and territories, with an interactive map, fast-charger distance analysis, Germany’s commissioning timeline, and the full evidence gallery."
date: "2026-10-22"
tags: ["gis", "data-visualization", "ev-charging", "projects"]
featured: true
interactive: "ev-charging-europe"
---

How dense is Europe’s EV charging network? Plot more than 275,000 stations on a map and clusters quickly emerge. But station counts alone tell you little about power, access restrictions, or where a driver can actually charge.

This article brings together the project’s interactive map and complete analytical report. The dataset covers **48 countries and territories, 275,402 charging-station records, and 753,603 charging points**. Filter and zoom into individual stations, then switch to the report to explore fast-charger distances and Germany’s commissioning timeline.

These are fixed project snapshots, with the summary generated on October 20, 2026. Germany, France, and the remaining countries use different sources and observation dates. Keep that distinction in mind when comparing them.

<!-- interactive:ev-charging-europe -->

## Start with the station map

In **Interactive map**, select a country you know, then narrow the results by power class, connector, or operating status. The map, summary figures, and charts update together. Click a cluster to zoom in; at closer zoom levels, click an individual station to inspect its details.

The map initially loads Germany, France, the United Kingdom, Spain, Italy, the Netherlands, Sweden, and Norway. Additional countries load on demand. The report uses the full snapshot rather than the map’s current filters, so its totals can differ from those shown in the map.

## Count charging points as well as stations

France has roughly 59,000 station records containing 260,700 charging points; Germany has roughly 116,400 stations containing 209,100 points. France has fewer station records but more points per station. The report also finds that stations with at least 17 points account for just 1.3% of records while containing 17.1% of the raw charging-point total.

Station counts and point counts therefore need to be read together. Registration and station-grouping rules differ between countries, so this comparison does not establish operating efficiency. Actual availability and queueing times are outside this dataset.

## Ask how far the next fast charger is

**Spatial analysis & report** preserves the H3 hexagon map, fast-charger distance screening, coordinate-quality investigation, and Germany’s year-by-year replay. Switch map metrics or drag the timeline to see the geography of commissioning cohorts among currently registered German records.

The distance analysis starts with 163,397 public, operating records with low or unknown power. It finds the nearest public, operating station with a maximum rated power of at least 50 kW. The median distance is 0.81 km and the 90th percentile is 5.77 km; 986 origins are more than 25 km away, and 324 are more than 50 km away.

One coordinate anomaly deserves particular attention. A group of 193 German long-distance records shares one coordinate, while the city field says Böblingen. The report retains these records and shows a sensitivity scenario excluding the group. A conspicuous gap on a map needs coordinate and source checks before it becomes evidence of unmet demand.

These are great-circle distances, with cross-border targets allowed. Roads, mountains, water, and motorway entrances are not modeled. The 10, 25, and 50 km screening scenarios cannot establish road-charging regulatory compliance. Germany’s timeline replays the commissioning cohorts of surviving records; it cannot reconstruct stations that have left the register.

## Explore the full evidence

Expand **Detailed evidence gallery** near the end of the report to see all 23 statistical charts, the latitude–longitude grid map, and the table of all 48 countries and territories. Country rankings can switch between station totals, stations per million people, and stations per unit of land area. The report also retains power, connector, city, and operator analyses.

Power thresholds need careful reading. The original ETL’s highest power class is **>50 kW**, representing 19.4% of records. Recalculating the numeric threshold **≥50 kW** gives 25.9%. The map’s highest-class labels have been corrected, and the report preserves this distinction. A station’s maximum rated power also does not mean every point can deliver that power simultaneously.

## Sources and limits

Germany uses the Bundesnetzagentur charging-station register, with a September 2026 snapshot. France uses the national IRVE aggregation, with an October 2026 snapshot. The remaining 46 countries and territories use the April 2026 Open Charge Map export. Population and land-area references are World Bank data for 2023.

The sources differ in registration rules and coverage. Sparse records cannot directly establish a real shortage of charging infrastructure. Operator and city names have not been fully resolved into consistent entities, so name-level rankings need to be read alongside completeness measures. One record with a negative charging-point count remains in the raw data and is disclosed in the report for reconciliation.

- [Germany’s Bundesnetzagentur register](https://www.bundesnetzagentur.de/DE/Sachgebiete/ElektrizitaetundGas/Unternehmen_Institutionen/E-Mobilitaet/Ladesaeulenkarte/start.html)
- [France’s IRVE dataset](https://odre.opendatasoft.com/explore/datasets/bornes-irve/)
- [Open Charge Map export](https://github.com/openchargemap/ocm-export)
- [World Bank data](https://data.worldbank.org/)

The original source attributions are retained, including CC BY 4.0, Licence Ouverte 2.0 / ODbL, and provider-specific terms. Offline boundaries come from public-domain Natural Earth data; online basemaps credit OpenStreetMap contributors and CARTO. The map uses MapLibre GL JS and Apache ECharts. The full report retains its source notes and calculation methods.
