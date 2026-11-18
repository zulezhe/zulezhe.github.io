---
title: "Hong Kongs öffentliches Ladenetz: 990 Orte zum Aufladen"
description: "Alle 990 öffentlich zugänglichen Ladeorte und 18.202 Ladepunkte, die bei der EPD Hongkongs registriert sind, aufgeschlüsselt nach Distrikt und Ladeklasse — wo sich Schnellladen konzentriert, welche Distrikte noch auf 13A-Steckdosen setzen und wie sich dieselbe Frage über 1.114 km² neu formt, wenn man sie an 48 europäischen Ländern misst."
date: "2026-11-12"
tags: ["ev-charging","gis","data-visualization","hong-kong"]
featured: true
interactive: "hk-ev-charging"
translationOf: "hk-ev-charging"
---

Meine letzte Analyse von Ladeinfrastruktur-Netzen [mapped 275,402 charging stations across 48 European countries](/blog/ev-charging-europe/). Dort ging es um Entfernung: wie weit zwei Schnellladepunkte auseinander liegen. Diesmal hole ich dieselbe Frage nach Hongkong. Die ganze Stadt umfasst 1.114 km², und theoretisch liegt kein Punkt mehr als eine Autostunde von einem anderen entfernt. Entfernung ist hier nicht die Variable; Bezirke, Gebäudealter und Parkhausmanagement sind es.

Die Daten stammen aus dem *Electric Vehicle Chargers for Public Access*-Datensatz des Environmental Protection Department, erfasst von öffentlichen und privaten Betreibern und vierteljährlich aktualisiert. Dieser Snapshot verzeichnet **990 öffentliche Ladestandorte mit insgesamt 18.202 Ladepunkten**. Jeder Standort trägt seinen District-Council-Bezirk und listet die Zahlen in drei Klassen auf: standard (13A, langsam), medium (AC) und quick/fast (DC). Die interaktive Ansicht unten filtert nach Klasse und Bezirk; ein Klick auf einen Kreis zeigt die Aufschlüsselung dieses Standorts.

<!-- interactive:hk-ev-charging -->

## Alle 18 Bezirke haben Ladepunkte, aber die Spanne ist siebenfach

Zuerst die Grundlage: Jeder der 18 District-Council-Bezirke Hongkongs hat öffentliche Ladepunkte. Verteilt man sie jedoch, hat Kowloon City 2.497 Ladepunkte, während Tai Po 357 hat — eine Lücke um den Faktor sieben.

Standortzahlen und Ladepunktzahlen muss man getrennt lesen. **Kwun Tong führt mit 116 Standorten**, aber seine Ladepunkt-Gesamtzahl (2.314) rangiert auf Platz zwei; Kowloon City hat nur 40 Standorte, belegt aber mit 2.497 Ladepunkten den ersten Platz. Der Grund ist nicht schwer zu erraten: Kai Tak. Dieses noch expandierende Reclamation-Viertel überspannt die Grenze zwischen Kowloon City und Kwun Tong, und seine neuen Parkhäuser werden immer größer — Airside allein verzeichnet 855 Ladepunkte, The Quayside 422, und die beiden Türme von The Twins zusammen rund 600. Wie lautet der Stadtmedian? **7 Ladepunkte pro Standort**. Der Mittelwert liegt bei 18,4. Eine Handvoll riesiger Standorte, die den Mittelwert hochziehen, während die meisten gewöhnlich bleiben — eine Form, die jeder wiedererkennt, der den Europa-Beitrag gelesen hat; die Stations-zu-Punkt-Verteilungen in Frankreich und Deutschland erzählen dieselbe Geschichte.

## Wo sind die langsamen Steckdosen geblieben

Nach Klassen aufgeteilt, zerfallen die 18.202 Ladepunkte der Stadt in 2.834 Standard-13A-Langsamsteckdosen (15,6 %), 11.609 Medium-AC (63,8 %) und 3.759 DC-Schnellladepunkte (20,7 %).

Die Verteilung der Standardsteckdosen ist der interessante Teil. Sie sind fast alle an einem Ort: **Kowloon City allein hat 1.116, also 39 % der gesamten Stadt** — mehr als tausend davon aus den großen neuen Parkhäusern in Kai Tak. Derweil hat Yau Tsim Mong gerade einmal 9 Standardladepunkte im gesamten Bezirk, Southern 2 und Tuen Mun 3. Das ist kein Zufall. Die Parkhäuser der alten Bezirke wurden vor Jahrzehnten geplant; der Nachrüstung eines Langsam-Ladeplatzes rechtfertigt selten Kosten und Raum, sodass der direkte Weg zu Medium- oder Schnellladen mehr Sinn ergibt. Neue Bezirke bekommen Parkhäuser etagenweise geplant, in denen über hundert 13A-Steckdosen als Reihen installiert werden können, damit Eigentümer über Nacht langsam laden können.

Anders ausgedrückt: **Hongkongs langsame Steckdosen stecken nicht in gewöhnlichen Wohnanlagen; sie stecken in Kai Taks Vorzeige-Parkhäusern**. Für eine Stadt, in der die meisten Menschen in Hochhäusern ohne privaten Stellplatz zum nächtlichen Laden leben, liest sich diese Verteilung etwas seltsam.

## Wo sich Schnellladen konzentriert

Die 3.759 DC-Schnellladepunkte verteilen sich auf 542 Standorte — **55 % der öffentlichen Ladestandorte der Stadt bieten Schnellladen an**. Auf die Landfläche umgerechnet sind das etwa 3,4 DC-Schnellladepunkte pro km².

Nach Bezirken führt Sha Tin mit 429 Schnellladepunkten, gefolgt von Kwun Tong mit 364 und Yau Tsim Mong mit 358. Schaltet man die Karte auf **Fast (DC)** um, wechseln die Kreise von Blau zu Rot entsprechend dem Schnellladeanteil jedes Standorts: Yau Tsim Mong und Central & Western werden fast vollständig rot, da die öffentlichen Ladepunkte in diesen kommerziellen Kernen fast alle Medium oder Fast sind, mit einem Langsamanteil nahe null, während die meisten New-Territories-Bezirke blau bleiben, wo langsame Steckdosen weiterhin die Basis bilden.

## Der Europa-Vergleich, mit echten Zahlen

Statt Allgemeinplätze auszutauschen, fügt dieser Beitrag Hongkong als 49. Registrierung in die Daten des Europa-Beitrags ein und lässt es in der Rangliste seinen Platz einnehmen — das Panel oben schaltet zwischen drei Kennzahlen um und stellt alle 49 Registrierungen nebeneinander.

**Zuerst das Gesamtvolumen** — Hongkongs 18.202 Ladepunkte rangieren auf Platz 8 von 49, hinter Frankreich (260.694), Deutschland (209.136), Spanien, dem Vereinigten Königreich, Schweden, Norwegen und Italien, und vor den 12.759 der Niederlande. Eine Stadt mit 7,5 Millionen Einwohnern verzeichnet mehr öffentliche Ladepunkte als jedes nordische Land. Natürlich variiert die Registrierungserfassung enorm — Deutschland und Frankreich erfassen weit vollständiger als die Niederlande —, also liest man das besser als Größenordnung, nicht als Liga-Tabelle.

**Die Form ist das Interessante** — beim Median der Ladepunkte pro Station belegt Hongkong Platz 1 mit 7: Norwegen und Schweden liegen bei 4, Frankreich, Deutschland, Italien und Spanien bei 2, die Niederlande und das Vereinigte Königreich bei nur 1. Der Mittelwert ist noch deutlicher: Hongkong 18,4, der höchste Wert Europas ist Norwegen mit 6,2, und der Europadurchschnitt liegt bei 2,7. Die eine Hälfte davon sind Registrierungsregeln: Deutschland loggt einen Datensatz pro Ladepunkt, Frankreich fasst mehrere Ladepunkte zu einer Station zusammen, Hongkong registriert nach Parkhaus. Die andere Hälfte ist die physische Welt: Europas Norm sind ein, zwei langsame Ladepunkte am Straßenrand, Hongkongs Norm eine ganze Reihe im Parkhaus — Airside allein verzeichnet 855 Ladepunkte, und die durchschnittliche Station keines europäischen Landes kommt auch nur nahe an diese Größenordnung heran.

**Der Schnellladeanteil hält sich** — Hongkongs 20,7 % liegen über 21 der 48 europäischen Registrierungen und unter 27; der Europawert (≥50 kW) beträgt 24,8 %. Die Niederlande mit ihren dichten Niedrigleistungspunkten haben einen Schnellladeanteil von nur 12,5 % — viele Ladepunkte und viele Schnellladepunkte sind auch in Europa zwei verschiedene Dinge.

Europas eigentliches Problem existiert hier nicht. Jener Beitrag maß eine mediane Entfernung von 0,81 km von Niedrigleistungsstationen zum nächsten Schnellladepunkt, mit 324 Ursprungspunkten jenseits von 50 km — Entfernung ist Europas knappe Ressource. Hongkong lässt sich in 45 Minuten Fahrzeit von Ende zu Ende durchqueren, Entfernung ist also nie die Variable; hinter den 990 Standorten ist das Knappe der Parkplatz selbst. Die Stadt hat über 100.000 elektrische Privatwagen; das meiste Laden findet in privaten Stellplätzen statt, und das öffentliche Netz ist nur eine Ergänzung.

Die Dichte pro km² lässt diesmal bewusst außer Acht: Der Europa-Snapshot verzeichnet nur 8.144 Stationen in den Niederlanden, eine Division durch die Landfläche würde also Registrierungsvollständigkeit vergleichen, nicht Infrastrukturdichte. Stationszahlen und Punktzahlen, Registrierungsregeln und Erfassung, muss man immer zusammen lesen — das war das Ende des Europa-Beitrags, und es ist auch das dieses.

## Quellen und Grenzen

Der Snapshot wurde am 12. November 2026 aus dem *Electric Vehicle Chargers for Public Access*-Datensatz des EPD erzeugt (DATA.GOV.HK / CSDI-Plattform, GeoJSON-API). Er wird vierteljährlich aktualisiert, umfasst Ladepunkte, die von Behörden und privaten Betreibern der Öffentlichkeit zur Verfügung gestellt werden, und schließt reservierte Stellplätze in privaten Wohnanlagen aus.

Die Klassen folgen den eigenen Feldern des Datensatzes: standard (13A), medium (einschließlich medium CCS DC), quick und fast. Dieser Beitrag fasst die quick- und fast-DC-Stufen zu einer Schnellladeklasse zusammen; die 6 Medium-CCS-DC-Datensätze des Datensatzes zählen als medium. Standorte mit null in allen drei Klassen wurden entfernt, die Koordinaten wurden auf Wertebereiche geprüft, und keine Ausreißer wurden gefunden. Auslastung, Live-Status und Warteschlangen liegen außerhalb der Daten — eine registrierte Zahl ist nicht dasselbe wie Verfügbarkeit.

Der Europa-Vergleich stammt aus dem verlustfreien Stations-Snapshot jenes Beitrags (stations.csv, 48 Länder und Gebiete, 275.402 Stationen, 753.603 Ladepunkte, erzeugt am 20. Oktober 2026). Es werden nur drei registrierungsbasierte Kennzahlen verwendet: total registrierte Punkte, Punkte pro Station und der Anteil mit ≥50 kW (Leistungsklasse 3). Hongkongs Schnellladeanteil nutzt die EPD-quick+fast-Basis; die beiden Definitionen sind nicht identisch, daher ist der Vergleich näherungsweise. Keiner der beiden Datensätze unterstützt Dichte pro km² — die Erfassung unterscheidet sich zu stark zwischen den Ländern, als dass diese Zahl etwas bedeuten könnte.

- [EPD Electric Vehicle Chargers for Public Access (DATA.GOV.HK)](https://data.gov.hk/en-data/dataset/hk-epd-evcpateam-evc-1)
- [Europe’s EV Charging Network: The Distance Behind the Dots](/blog/ev-charging-europe/)
