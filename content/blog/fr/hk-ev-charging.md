---
title: "Le réseau de recharge public de Hong Kong : 990 endroits où se brancher"
description: "Les 990 emplacements de recharge publics et les 18 202 bornes de recharge enregistrés auprès du EPD de Hong Kong, répartis par district et par classe de recharge — où se concentrent les bornes de recharge rapide, quels districts dépendent encore des prises 13A, et comment la même question se reformule sur 1 114 km² lorsqu'on la compare à 48 pays européens."
date: "2026-11-12"
tags: ["ev-charging","gis","data-visualization","hong-kong"]
featured: true
interactive: "hk-ev-charging"
translationOf: "hk-ev-charging"
---

Mon précédente analyse de réseau de recharge [mapped 275,402 charging stations across 48 European countries](/blog/ev-charging-europe/). La question y était la distance : à quelle distance deux bornes de recharge rapide se trouvent-elles l'une de l'autre. Cette fois, je ramène la même question à Hong Kong. Toute la ville couvre 1 114 km², et en théorie aucun point n'est à plus d'une heure de route d'un autre. La distance n'est pas la variable ici ; ce sont les districts, l'âge des bâtiments et la gestion des parkings.

Les données proviennent du jeu de données *Electric Vehicle Chargers for Public Access* du Environmental Protection Department, enregistré par des opérateurs publics et privés et actualisé chaque trimestre. Ce cliché recense **990 emplacements de recharge publics avec 18 202 bornes au total**. Chaque emplacement porte son district de District Council et détaille les effectifs en trois classes : standard (lente 13A), moyenne (AC), et rapide (DC). L'interactif ci-dessous filtre par classe et par district ; cliquez sur n'importe quel cercle pour voir le détail de l'emplacement.

<!-- interactive:hk-ev-charging -->

## Les 18 districts ont tous des bornes, mais l'écart est d'un facteur sept

D'abord, la base : chacun des 18 districts de District Council de Hong Kong dispose de bornes publiques. Répartis, cependant, Kowloon City en compte 2 497 tandis que Tai Po en a 357 — un écart d'un facteur sept.

Le nombre d'emplacements et le nombre de bornes doivent se lire séparément. **Kwun Tong mène avec 116 emplacements**, mais son total de bornes (2 314) arrive deuxième ; Kowloon City ne compte que 40 emplacements mais prend la première place avec 2 497 bornes. La raison n'est pas difficile à deviner : Kai Tak. Ce district de polder en expansion continue chevauche la frontière entre Kowloon City et Kwun Tong, et ses nouveaux parkings ne cessent de grandir — Airside à elle seule enregistre 855 bornes, The Quayside 422, et les deux tours de The Twins environ 600 à elles deux. Quelle est la médiane à l'échelle de la ville ? **7 bornes par emplacement**. La moyenne est de 18,4. Une poignée d'emplacements géants tirant la moyenne vers le haut pendant que la plupart restent ordinaires, c'est une forme que quiconque a lu l'article sur l'Europe reconnaîtra — les distributions borne-vers-station en France et en Allemagne racontent la même histoire.

## Où sont passées les prises lentes

Réparties par classe, les 18 202 bornes de la ville se décomposent en 2 834 prises lentes standard 13A (15,6 %), 11 609 AC moyennes (63,8 %) et 3 759 bornes DC rapides (20,7 %).

La distribution des prises standard est la partie intéressante. Elles sont presque toutes au même endroit : **Kowloon City seule en compte 1 116, soit 39 % du total de la ville** — plus d'un millier provenant des grands nouveaux parkings de Kai Tak. Pendant ce temps, Yau Tsim Mong n'a que 9 bornes standard dans tout le district, Southern 2, et Tuen Mun 3. Ce n'est pas une coïncidence. Les parkings des anciens quartiers ont été conçus il y a des décennies ; installer une place de recharge lente en rénovation ne couvre que rarement son coût et son espace, si bien que passer directement à la recharge moyenne ou rapide a plus de sens. Les nouveaux districts obtiennent des parkings planifiés étage par étage, où plus d'une centaine de prises 13A peuvent s'aligner pour que les propriétaires rechargent lentement pendant la nuit.

Autrement dit, **les prises lentes de Hong Kong ne sont pas dans les ensembles résidentiels ordinaires ; elles sont dans les parkings vitrine de Kai Tak**. Pour une ville où la plupart des gens vivent en tour sans place privée où recharger pendant la nuit, cette distribution paraît un peu étrange.

## Où se concentre la recharge rapide

Les 3 759 bornes DC rapides se répartissent sur 542 emplacements — **55 % des emplacements de recharge publics de la ville offrent la recharge rapide**. Rapportée à la superficie, cela fait environ 3,4 bornes DC rapides par km².

Par district, Sha Tin mène avec 429 bornes rapides, suivie de Kwun Tong avec 364 et Yau Tsim Mong avec 358. Passez la carte en **Rapide (DC)** et les cercles passent du bleu au rouge selon la part de recharge rapide de chaque emplacement : Yau Tsim Mong et Central & Western basculent presque entièrement, car les bornes publiques de ces cœurs commerciaux sont presque toutes moyennes ou rapides avec une part lente proche de zéro, tandis que la plupart des districts des Nouveaux Territoires restent bleus, où les prises lentes constituent encore la base.

## La comparaison avec l'Europe, en chiffres réels

Plutôt que d'échanger des généralités, celle-ci insère Hong Kong comme 49ᵉ registre dans les données de l'article sur l'Europe et le laisse prendre sa place dans le classement — le panneau ci-dessus bascule entre trois indicateurs et aligne les 49 registres côte à côte.

**D'abord, le volume total** — les 18 202 points de recharge de Hong Kong se classent 8ᵉ sur 49, derrière la France (260 694), l'Allemagne (209 136), l'Espagne, le Royaume-Uni, la Suède, la Norvège et l'Italie, et devant les 12 759 des Pays-Bas. Une ville de 7,5 millions d'habitants enregistre plus de points de recharge publics que n'importe quel pays nordique. Bien sûr, la couverture des registres varie énormément — l'Allemagne et la France enregistrent bien plus exhaustivement que les Pays-Bas — donc lisez cela comme un ordre de grandeur, pas un classement.

**C'est la forme qui devient intéressante** — par médiane de points de recharge par station, Hong Kong se classe 1ᵉʳ avec 7 : la Norvège et la Suède sont à 4, la France, l'Allemagne, l'Italie et l'Espagne à 2, les Pays-Bas et le Royaume-Uni à seulement 1. La moyenne est encore plus frappante : Hong Kong 18,4, la plus élevée d'Europe étant la Norvège à 6,2, et la moyenne européenne à 2,7. La moitié de cela tient aux règles d'enregistrement : l'Allemagne consigne un enregistrement par borne, la France regroupe plusieurs bornes en une station, Hong Kong enregistre par parking. L'autre moitié est le monde physique : la norme européenne, c'est une ou deux bornes lentes au bord de la route ; celle de Hong Kong, une rangée entière dans un parking — Airside à elle seule enregistre 855 bornes, et la station moyenne d'aucun pays européen n'approche cette échelle.

**La part de recharge rapide tient bien la comparaison** — les 20,7 % de Hong Kong laissent 21 des 48 registres européens au-dessus et 27 en dessous ; le chiffre européen (≥50 kW) est de 24,8 %. Les Pays-Bas, avec leurs points de faible puissance denses, ont une part de recharge rapide de seulement 12,5 % — beaucoup de points de recharge et beaucoup de bornes rapides sont deux choses différentes, en Europe aussi.

Le vrai problème de l'Europe n'existe pas ici. Cet article mesurait une distance médiane de 0,81 km des stations de faible puissance à la borne rapide la plus proche, avec 324 origines au-delà de 50 km — la distance est la ressource rare de l'Europe. Hong Kong se traverse en 45 minutes, donc la distance n'est jamais la variable ; derrière les 990 emplacements, ce qui est rare, c'est la place de parking elle-même. La ville compte plus de 100 000 voitures électriques privées ; l'essentiel de la recharge se fait dans des places privées, et le réseau public n'est qu'un complément.

La densité par km² est volontairement laissée de côté cette fois : le cliché européen n'enregistre que 8 144 stations aux Pays-Bas, donc diviser par la superficie reviendrait à comparer l'exhaustivité des enregistrements, pas la densité des infrastructures. Nombre de stations et nombre de bornes, règles d'enregistrement et couverture doivent toujours se lire ensemble — c'était la conclusion de l'article sur l'Europe, et c'est aussi celle de celui-ci.

## Sources et limites

Le cliché a été généré le 12 novembre 2026 à partir du jeu de données *Electric Vehicle Chargers for Public Access* de l'EPD (DATA.GOV.HK / plateforme CSDI, API GeoJSON). Il est actualisé chaque trimestre, couvre les bornes mises à disposition du public par les opérateurs gouvernementaux et privés, et exclut les places dédiées des résidences privées.

Les classes suivent les champs propres au jeu de données : standard (13A), moyenne (y compris CCS DC moyenne), quick et fast. Cet article fusionne les niveaux quick et fast DC en une seule classe de recharge rapide ; les 6 enregistrements CCS DC moyennes du jeu de données sont comptés comme moyennes. Les emplacements à zéro dans les trois classes ont été retirés, les coordonnées ont été vérifiées par plage, et aucune valeur aberrante n'a été trouvée. L'utilisation, l'état en temps réel et l'attente sont hors du périmètre des données — un nombre enregistré n'est pas la disponibilité.

La comparaison européenne provient du cliché de stations sans perte de cet article (stations.csv, 48 pays et territoires, 275 402 stations, 753 603 points de recharge, généré le 20 octobre 2026). Seuls trois indicateurs sur base d'enregistrement sont utilisés : le total de points enregistrés, les points par station et la part classée ≥50 kW (classe de puissance 3). La part de recharge rapide de Hong Kong utilise la base quick+fast de l'EPD ; les deux définitions ne sont pas identiques, donc la comparaison est approximative. Aucun des deux jeux de données ne permet une densité par km² — la couverture diffère trop entre pays pour que ce chiffre ait un sens.

- [EPD Electric Vehicle Chargers for Public Access (DATA.GOV.HK)](https://data.gov.hk/en-data/dataset/hk-epd-evcpateam-evc-1)
- [Europe’s EV Charging Network: The Distance Behind the Dots](/blog/ev-charging-europe/)
