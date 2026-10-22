# Bilingual EV charging article

The primary article is `content/blog/ev-charging-europe.md` (English). The Chinese translation is `ev-charging-europe-zh.md`; `translationOf` keeps it out of duplicate index/feed listings. Both routes provide reciprocal language links and hreflang metadata.

`translations.json` contains reviewed English display strings for the supplied project. `report-en/` contains the English authored report modules. The original Chinese report bundle remains unchanged under `public/interactive/ev-charging-europe/analysis-report/dist/`.

To regenerate English map assets from the checked-in Chinese copy:

```sh
node scripts/localize-ev-charging.mjs
```

To rebuild the full English report, use the installed Data plugin and the original source report directory:

```sh
node scripts/localize-ev-charging.mjs --report-source /absolute/path/to/ev-charging-europe/analysis-report --data-plugin /absolute/path/to/data-analytics/version
```

The script works under ignored `.content-build/`, uses only the permitted report content/snapshot boundaries, and invokes the plugin’s verified builder. It does not fetch new data or modify the original project. English display labels are translated recursively; numeric evidence, query IDs, source links, and thresholds are retained. Count charts explicitly show thousands with derived display fields; raw reviewed rows remain available for source inspection. Browser-owned date formatting continues to follow browser locale.

Map geometry, operators, the compressed original CSV, and vendor files are shared between languages. English summary metadata corrects the already-disclosed OCM coverage description from 38 to the verified 46 countries/territories outside Germany and France.
