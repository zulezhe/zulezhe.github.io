---
title: "Le réseau de bornes de recharge pour véhicules électriques en Europe : les distances derrière les points"
description: "Explorez 275 402 enregistrements de bornes de recharge répartis dans 48 pays et territoires européens, avec une carte interactive, une analyse des distances des chargeurs rapides, la chronologie de mise en service en Allemagne et l'intégralité de la galerie de preuves."
date: "2026-10-22"
tags: ["gis","data-visualization","ev-charging","projects"]
featured: true
interactive: "ev-charging-europe"
translationOf: "ev-charging-europe"
---

Quelle est la densité du réseau de bornes de recharge pour véhicules électriques en Europe ? Placez plus de 275 000 stations sur une carte et des clusters apparaissent rapidement. Mais le simple nombre de stations en dit peu sur la puissance, les restrictions d'accès, ou les endroits où un conducteur peut réellement recharger.

Cet article réunit la carte interactive du projet et le rapport analytique complet. Le jeu de données couvre **48 pays et territoires, 275 402 enregistrements de stations de recharge et 753 603 points de recharge**. Filtrez et zoomez sur des stations individuelles, puis passez au rapport pour explorer les distances aux bornes de recharge rapide et la chronologie des mises en service en Allemagne.

Il s'agit d'instantanés fixes du projet, dont le résumé a été généré le 20 octobre 2026. L'Allemagne, la France et les autres pays utilisent des sources et des dates d'observation différentes. Gardez cette distinction à l'esprit lors de leurs comparaisons.

<!-- interactive:ev-charging-europe -->

## Commencer par la carte des stations

Dans **Carte interactive**, sélectionnez un pays que vous connaissez, puis affinez les résultats par classe de puissance, type de connecteur ou état d'exploitation. La carte, les chiffres du résumé et les graphiques se mettent à jour ensemble. Cliquez sur un cluster pour zoomer ; à des niveaux de zoom plus proches, cliquez sur une station individuelle pour examiner ses détails.

La carte charge initialement l'Allemagne, la France, le Royaume-Uni, l'Espagne, l'Italie, les Pays-Bas, la Suède et la Norvège. D'autres pays se chargent à la demande. Le rapport utilise l'instantané complet plutôt que les filtres actuels de la carte, donc ses totaux peuvent différer de ceux affichés sur la carte.

## Compter les points de recharge autant que les stations

La France compte environ 59 000 enregistrements de stations contenant 260 700 points de recharge ; l'Allemagne compte environ 116 400 stations contenant 209 100 points. La France a moins d'enregistrements de stations mais plus de points par station. Le rapport révèle également que les stations comptant au moins 17 points ne représentent que 1,3 % des enregistrements tout en contenant 17,1 % du total brut des points de recharge.

Les nombres de stations et les nombres de points doivent donc être lus ensemble. Les règles d'enregistrement et de regroupement des stations diffèrent selon les pays, donc cette comparaison ne démontre pas d'efficacité opérationnelle. La disponibilité réelle et les temps d'attente sont hors du périmètre de ce jeu de données.

## Se demander à quelle distance se trouve la prochaine borne rapide

**Analyse spatiale & rapport** conserve la carte à hexagones H3, l'analyse des distances aux bornes rapides, l'investigation de la qualité des coordonnées et la relecture année par année de l'Allemagne. Changez de métrique sur la carte ou faites glisser la chronologie pour voir la géographie des cohortes de mise en service parmi les enregistrements allemands actuellement enregistrés.

L'analyse des distances part de 163 397 enregistrements publics et en exploitation avec une puissance faible ou inconnue. Elle recherche la station publique et en exploitation la plus proche avec une puissance nominale maximale d'au moins 50 kW. La distance médiane est de 0,81 km et le 90e centile est de 5,77 km ; 986 points d'origine sont à plus de 25 km, et 324 à plus de 50 km.

Une anomalie de coordonnées mérite une attention particulière. Un groupe de 193 enregistrements allemands de longue distance partage une seule coordonnée, tandis que le champ ville indique Böblingen. Le rapport conserve ces enregistrements et présente un scénario de sensibilité excluant le groupe. Une lacune visible sur une carte nécessite des vérifications des coordonnées et des sources avant de devenir une preuve de demande insatisfaite.

Il s'agit de distances à vol d'oiseau, avec des cibles transfrontalières autorisées. Les routes, les montagnes, l'eau et les entrées d'autoroute ne sont pas modélisées. Les scénarios de dépistage à 10, 25 et 50 km ne peuvent pas établir la conformité réglementaire en matière de recharge routière. La chronologie de l'Allemagne rejoue les cohortes de mise en service des enregistrements subsistants ; elle ne peut pas reconstituer les stations ayant quitté le registre.

## Explorer l'ensemble des preuves

Dépliez **Galerie détaillée de preuves** vers la fin du rapport pour voir les 23 graphiques statistiques, la carte en grille latitude–longitude et le tableau des 48 pays et territoires. Les classements par pays peuvent basculer entre les totaux de stations, les stations par million d'habitants et les stations par unité de surface. Le rapport conserve également les analyses par puissance, connecteur, ville et opérateur.

Les seuils de puissance exigent une lecture attentive. La classe de puissance la plus élevée de l'ETL d'origine est **>50 kW**, représentant 19,4 % des enregistrements. Le recalcul avec le seuil numérique **≥50 kW** donne 25,9 %. Les étiquettes de classe la plus élevée de la carte ont été corrigées, et le rapport préserve cette distinction. La puissance nominale maximale d'une station ne signifie pas non plus que chaque point puisse délivrer cette puissance simultanément.

## Sources et limites

L'Allemagne utilise le registre des stations de recharge de la Bundesnetzagentur, avec un instantané de septembre 2026. La France utilise l'agrégation nationale IRVE, avec un instantané d'octobre 2026. Les 46 autres pays et territoires utilisent l'export Open Charge Map d'avril 2026. Les références de population et de superficie sont les données de la Banque mondiale pour 2023.

Les sources diffèrent par leurs règles d'enregistrement et leur couverture. Des enregistrements clairsemés ne peuvent pas établir directement une réelle pénurie d'infrastructures de recharge. Les noms d'opérateurs et de villes n'ont pas été entièrement résolus en entités cohérentes, donc les classements au niveau des noms doivent être lus parallèlement aux mesures d'exhaustivité. Un enregistrement avec un nombre de points de recharge négatif reste dans les données brutes et est divulgué dans le rapport à des fins de réconciliation.

- [Germany’s Bundesnetzagentur register](https://www.bundesnetzagentur.de/DE/Sachgebiete/ElektrizitaetundGas/Unternehmen_Institutionen/E-Mobilitaet/Ladesaeulenkarte/start.html)
- [France’s IRVE dataset](https://odre.opendatasoft.com/explore/datasets/bornes-irve/)
- [Open Charge Map export](https://github.com/openchargemap/ocm-export)
- [World Bank data](https://data.worldbank.org/)

Les attributions de sources d'origine sont conservées, notamment CC BY 4.0, Licence Ouverte 2.0 / ODbL, et les conditions spécifiques aux fournisseurs. Les frontières hors ligne proviennent des données du domaine public Natural Earth ; les fonds de carte en ligne créditent les contributeurs d'OpenStreetMap et CARTO. La carte utilise MapLibre GL JS et Apache ECharts. Le rapport complet conserve ses notes de sources et ses méthodes de calcul.

Pour aller plus loin : à quoi ressemble la même question à l'échelle d'une ville ? Voir [Hong Kong’s Public Charging Network: 990 Places to Plug In](/blog/hk-ev-charging/).
