import { EnglishEvidenceChart as EvidenceChart } from "./EnglishEvidenceChart.jsx";
import React, { useMemo, useState } from 'react';
import { DataComponent, DataTable, ReportSection, RichNarrative, useDataApp } from '../../data-app-public.jsx';
const pc = n => (n * 100).toFixed(1) + '%';
const fmt = n => n.toLocaleString('en-GB');
function Passage({ id, queries, children }) { const { reviewedRows } = useDataApp(); return <ReportSection id={'story:' + id} queryId={queries[0]} queryIds={queries} sourceRowsByQuery={Object.fromEntries(queries.map(q => [q, reviewedRows(q)]))} title="Spatial analysis" showHeading={false}><RichNarrative id={'story:' + id + ':body'} value={children}/></ReportSection>; }
function Atlas({ view, setView, year, setYear }) {
    const { snapshot, reviewedRows } = useDataApp();
    const hex = reviewedRows('story_hex');
    const [threshold, setThreshold] = useState(25);
    const [selected, setSelected] = useState(null);
    const [zoom, setZoom] = useState(1);
    const de = view === 'germany';
    // Lambert azimuthal equal-area, spherical Earth; 52N 10E origin.
    const project = ([lon, lat]) => { const p = lat * Math.PI / 180, l = (lon - 10) * Math.PI / 180, p0 = 52 * Math.PI / 180, k = Math.sqrt(2 / (1 + Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l))); return [k * Math.cos(p) * Math.sin(l), -k * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l))]; };
    const scope = de ? { left: -.09, right: .095, top: -.065, bottom: .095 } : { left: -.40, right: .40, top: -.39, bottom: .38 };
    const screen = p => { const [x, y] = project(p); return [(x - scope.left) / (scope.right - scope.left) * 960, (y - scope.top) / (scope.bottom - scope.top) * 780]; };
    const ring = r => r.map((p, i) => (i ? 'L' : 'M') + screen(p).map(v => v.toFixed(2)).join(',')).join(' ') + 'Z';
    const outlines = useMemo(() => snapshot.evBoundary.features.map((f, i) => ({ i, d: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(poly => poly.map(ring).join(' ')).join(' ') })), [de]);
    const cells = useMemo(() => hex.filter(r => de ? Object.keys(r.deYears).length : r.lon >= -25 && r.lon <= 45 && r.lat >= 32 && r.lat <= 72).map(r => ({ ...r, path: ring(r.boundary) })), [de, hex]);
    const yearPoints = r => Object.entries(r.deYears).reduce((n, [y, v]) => n + (Number(y) <= year ? v : 0), 0);
    const growth = reviewedRows('story_germany').find(r => r.year === year);
    const color = r => { if (de) {
        const n = yearPoints(r);
        return n < 1 ? 'transparent' : n < 10 ? '#466e70' : n < 50 ? '#69a694' : n < 200 ? '#a8cf9f' : n < 500 ? '#e4d697' : '#f2b45b';
    } if (view === 'gaps') {
        if (!r.low)
            return '#29434b';
        const far = r['remote' + threshold];
        return far >= 5 ? '#f0ad67' : far > 0 ? '#bc7860' : '#416f72';
    } return ['#31565e', '#58877f', '#8db59a', '#d5d49b', '#f2b45b'][r.density100 < 5 ? 0 : r.density100 < 20 ? 1 : r.density100 < 60 ? 2 : r.density100 < 150 ? 3 : 4]; };
    const setMode = v => { setView(v); setSelected(null); setZoom(1); };
    return <DataComponent id="story:atlas" queryId="story_hex" sourceRows={hex} displayRows={cells} title="European charging network atlas" kind="custom" className="story-atlas-evidence">
    <div id="story-atlas" className="story-atlas">
    <div className="story-map-toolbar"><div role="group" aria-label="Spatial view">{[['density', "Station density"], ['gaps', "Fast-charger distance"], ['germany', "Germany replay"]].map(([v, l]) => <button key={v} aria-pressed={view === v} onClick={() => setMode(v)}>{l}</button>)}</div><div role="group" aria-label="Map zoom"><button aria-label="Zoom out" onClick={() => setZoom(Math.max(1, zoom - .5))}>−</button><button aria-label="Zoom in" onClick={() => setZoom(Math.min(3, zoom + .5))}>+</button><button onClick={() => setZoom(1)}>Reset</button></div></div>
    <div className="story-map-layout"><div className="story-map-canvas" data-reviewed-rows>
    <svg viewBox={`${480 - 480 / zoom} ${390 - 390 / zoom} ${960 / zoom} ${780 / zoom}`} role="img" aria-label={de ? "Hexagon map of currently registered German charging points accumulated by commissioning year" : "European H3 hexagon map of station density or fast-charger distance screening"}>
    {outlines.map(r => <path key={r.i} d={r.d} fill="#203b43" stroke="#4b656a" strokeWidth={de ? .7 : .65}/>)}
    {cells.map(r => <path key={r.cell} d={r.path} fill={color(r)} stroke="#142e36" strokeWidth={de ? .35 : .15} onClick={() => setSelected(r)}><title>{r.cell} · {de ? yearPoints(r) + " registered charging points" : view === 'gaps' ? r['remote' + threshold] + " distant origins" : r.density100 + " stations/100 km\u00B2"}; click for details</title></path>)}
    {(de ? [["Berlin", 13.4, 52.5], ["Hamburg", 10, 53.55], ["Munich", 11.58, 48.14], ["Cologne", 6.96, 50.94]] : [["London", -.1, 51.5], ["Paris", 2.35, 48.86], ["Berlin", 13.4, 52.5], ["Madrid", -3.7, 40.4], ["Rome", 12.5, 41.9], ["Oslo", 10.75, 59.9]]).map(([n, lon, lat]) => { const [x, y] = screen([lon, lat]); return <g key={n} pointerEvents="none"><circle cx={x} cy={y} r="2.5" fill="#e2e9e3"/><text x={x + 7} y={y - 6} fill="#d9e5dc" fontSize="13" paintOrder="stroke" stroke="#17313a" strokeWidth="3">{n}</text></g>; })}
    </svg></div>
    <aside className="story-map-aside">
    <h3>{de ? "How Germany\u2019s network expanded" : view === 'gaps' ? "Fast-charger distances around existing stations" : "Where charging records cluster"}</h3>
    <p>{de ? "Accumulate the current snapshot by commissioning year to explore its spatial expansion." : view === 'gaps' ? "Use public, operating stations with low or unknown power as probes to find records farther from fast charging." : "H3 resolution 5 hexagons, normalized by each cell\u2019s actual area to reduce latitude-related grid bias."}</p>
    {de ? <div className="story-map-slider"><label htmlFor="story-year">Commissioned by <b>{year}</b></label><input id="story-year" type="range" min="2010" max="2026" value={year} onChange={e => { setYear(Number(e.target.value)); setSelected(null); }}/><div className="story-timeline-ends"><span>2010</span><span>2026 (partial)</span></div><strong>{fmt(growth?.points || 0)}</strong><span>currently registered charging points with a commissioning year</span><p>DC point share: {pc(growth?.dcShare || 0)}</p></div> : view === 'gaps' ? <div className="story-map-slider"><label htmlFor="story-threshold">Great-circle screening threshold</label><select id="story-threshold" value={threshold} onChange={e => { setThreshold(Number(e.target.value)); setSelected(null); }}>{[10, 25, 50].map(n => <option key={n} value={n}>{n} km</option>)}</select><p>Orange cells contain ≥5 origins beyond the threshold; dark orange means 1–4. Teal means none beyond it; gray means no probes.</p></div> : <div className="story-legend"><span>Station records per 100 km²</span><div>{['<5', '5–20', '20–60', '60–150', '≥150'].map((n, i) => <span key={n}><i style={{ background: ['#31565e', '#58877f', '#8db59a', '#d5d49b', '#f2b45b'][i] }}/>{n}</span>)}</div></div>}
    {de && <p className="story-map-note">Cumulative point bands: 1–9, 10–49, 50–199, 200–499, ≥500.</p>}
    <div className="story-cell-detail" aria-live="polite">{selected ? <><b>{selected.lat.toFixed(2)}°N / {selected.lon.toFixed(2)}°E</b><p>{de ? fmt(yearPoints(selected)) + " accumulated registered points" : view === 'gaps' ? `${selected.low} probes; ${selected['remote' + threshold]} beyond ${threshold} km` : `${selected.stations} stations \u00B7 ${selected.areaKm2.toFixed(1)} km²`}</p></> : <p>Click a hexagon for details. Use + / − to change the scale.</p>}</div>
    <p className="story-map-note">Only cells with records are colored. Blank areas do not prove an absence of facilities. Straight-line distance is not driving distance.</p>
    </aside></div></div>
    </DataComponent>;
}
export function NetworkStory() {
    const { snapshot, reviewedRows } = useDataApp();
    const f = snapshot.storyFacts;
    const [view, setView] = useState('density');
    const [year, setYear] = useState(2026);
    const cr = reviewedRows('story_distance_country').filter(r => r.sites >= 500).slice(0, 12);
    const out = reviewedRows('story_outliers')[0];
    const toGermany = () => { setView('germany'); document.querySelector('#story-atlas').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    return <div className="network-story">
    <Passage id="opening" queries={['story_facts', 'story_distance_bands', 'story_outliers']}>{`## From station counts to charging accessibility

This dataset contains 275.4k station records. A more specific spatial question is whether fast charging is available near existing low-power stations.

We use ${fmt(f.originCount)} public, operating stations with low or unknown power as probes, finding the nearest public, operating \u226550 kW record. For 90% of probes, the target is within **${f.p90Km} km**; **${fmt(f.far25)} are more than 25 km away**. These are leads for investigation, not confirmed charging deserts.

Origins are station records rather than residents or vehicles, and distances are great-circle distances. The results describe recorded accessibility around existing stations in this snapshot.`}</Passage>
    <Atlas view={view} setView={setView} year={year} setYear={setYear}/>
    <nav className="story-chapters" aria-label="Report chapters"><a href="#story-distance">Distance distributions</a><a href="#story-anomaly">Check spatial anomalies</a><a href="#story-germany">Replay Germany</a><a href="#story-policy">The 60 km rule</a><a href="#story-method">Data and methods</a></nav>
    <section id="story-distance" className="story-chapter">
    <div className="story-two-col"><Passage id="distance" queries={['story_facts', 'story_distance_country']}>{`## Most probes are close, but the long tail needs investigation

The median great-circle distance is just **${f.medianKm} km**. Yet 986 probes are beyond 25 km and 324 beyond 50 km. An average or a single national density hides this small group of long-distance records.

Distributions differ by country. The 90th percentile is 3.17 km in Germany, 7.31 km in France, 12.24 km in Italy, and 16.19 km in Finland. This is the distance within which 90% of a country\u2019s probes fall.

Germany and France contribute 78.6% of all probes, and official and community sources are mixed. These record-level differences are not a ranking of service to residents.`}</Passage><EvidenceChart id="story:distance-bands" queryId="story_distance_bands" title="Great-circle distance from existing low-power stations to the nearest fast charger" rows={reviewedRows('story_distance_bands')} sourceRows={reviewedRows('story_distance_bands')} spec={{ type: 'horizontalBar', x: 'band', y: 'stationShare' }} height={310}/></div>
    <EvidenceChart id="story:country-distance" queryId="story_distance_country" title="Distance distributions: median and 90th percentile (km)" description="Top 12 countries by origin count, with at least 500 origins. Cross-border targets allowed; roads, ferries, traffic, and queues excluded." rows={cr.map(r => ({ ...r, "Median": r.medianKm, "90th percentile": r.p90Km }))} sourceRows={reviewedRows('story_distance_country')} spec={{ type: 'horizontalBar', x: 'name', y: "Median", fields: ["Median", "90th percentile"], stackable: false }} height={480}/>
    <EvidenceChart id="story:sensitivity" queryId="story_sensitivity" title="How does the share of distant records change with the threshold?" rows={reviewedRows('story_sensitivity')} sourceRows={reviewedRows('story_sensitivity')} spec={{ type: 'bar', x: 'threshold', y: 'farShare' }} height={300}/>
    </section>
    <section id="story-anomaly" className="story-chapter">
    <Passage id="anomaly" queries={['story_outliers', 'story_facts']}>{`## Repeated coordinates change the interpretation of the most distant records

Among the distant results, ${out.records} German records share **${out.lat.toFixed(5)}°N、${out.lon.toFixed(5)}\u00B0E**, with the city field **${out.city}** and a nearest fast-charger distance of about **${out.nearestKm.toFixed(1)} km**. The repeated coordinates and city field need to be checked against the original source.

This group accounts for **${pc(out.records / f.far50)}** of all results beyond 50 km. Excluding it only in a sensitivity scenario reduces the >50 km count from 324 to ${f.far50 - out.records} records. The original data is retained, and the remaining records are not treated as verified infrastructure gaps.

Coordinate and source validation should precede road-access, population, and vehicle-demand analysis. The most striking anomaly is not necessarily the best place to invest.`}</Passage>
    <DataComponent id="story:outlier-table" title="Distant records sharing coordinates: priority checks" queryId="story_outliers" sourceRows={reviewedRows('story_outliers')} displayRows={reviewedRows('story_outliers').slice(0, 8)} kind="table"><DataTable compactNumbers={false} rows={reviewedRows('story_outliers').slice(0, 8)} caption="Records beyond 50 km sharing coordinates and a city field" columns={[{ key: 'country', label: "Country" }, { key: 'city', label: "City field" }, { key: 'records', label: "Records" }, { key: 'nearestKm', label: "Nearest fast charger (km)" }, { key: 'lat', label: "Latitude" }, { key: 'lon', label: "Longitude" }]}/></DataComponent>
    </section>
    <section id="story-germany" className="story-chapter">
    <div className="story-two-col"><Passage id="germany" queries={['story_germany', 'story_hex']}>{`## Germany\u2019s network expanded and changed its power mix

Accumulating current records by commissioning year gives **${fmt(f.de2015.points)}** registered points through 2015, **${fmt(f.de2020.points)}** through 2020, and **${fmt(f.lastDE.points)}** through 2026.

The DC point share in this cumulative sample rises from **${pc(f.de2015.dcShare)}** in 2015 to **${pc(f.lastDE.dcShare)}** in 2026. This uses the AC/DC field and valid point counts directly, rather than treating power classes as a substitute for DC.

This is a replay of commissioning cohorts among surviving registered records, not a reconstruction of stations that have exited. The partial 2026 cohort cannot establish a construction slowdown.`}</Passage><div className="story-germany-action"><b>Put the commissioning cohorts on the map</b><p>Switch to Germany and drag the timeline to explore the locations of commissioning cohorts.</p><button type="button" onClick={toGermany}>Open Germany replay ↗</button></div></div>
    <EvidenceChart id="story:de-cumulative" queryId="story_germany" title="Currently registered German charging points by commissioning year · AC / DC" rows={reviewedRows('story_germany')} sourceRows={reviewedRows('story_germany')} spec={{ type: 'area', x: 'date', y: 'AC', fields: ['AC', 'DC'] }} height={360}/>
    </section>
    <section id="story-policy" className="story-chapter">
    <Passage id="policy" queries={['story_facts']}>{`## The 60 km rule concerns roads, not circles on a map

Article 3 of the EU AFIR addresses charging pools for light-duty vehicles on the TEN-T core road network in each direction of travel. The end-2025 baseline includes a maximum 60 km spacing, at least 400 kW of pool output, and at least one 150 kW charging point, subject to conditions and exceptions. See the [regulation](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32023R1804).

The report\u2019s 25 km threshold is only a screening scenario and cannot be converted into the statutory 60 km spacing. Water, mountains, road directions, and motorway entrances can separate nearby coordinates. Station maximum power multiplied by point count is not simultaneously available charging-pool output.

Compliance assessment requires TEN-T road geometry, network distances, access in both travel directions, charging-pool grouping, and simultaneously available output. This dataset cannot support a compliance rate.`}</Passage>
    <div className="story-evidence-ladder"><div><b>What this snapshot supports</b><span>Record counts, H3 density, great-circle distances, registered cohorts</span></div><div><b>What needs checking</b><span>Coordinate validity, road access, access restrictions, live status</span></div><div><b>What decisions additionally need</b><span>Population and EV demand, traffic, road distances, charging-pool capacity</span></div></div>
    </section>
    <section id="story-method" className="story-chapter">
    <Passage id="method" queries={['story_facts', 'story_hex', 'story_distance_country']}>{`## Data boundaries and reproducibility

**Spatial unit.** H3 resolution 5 aggregates 275.4k stations into ${fmt(f.hexCount)} occupied hexagons. H3 cells are not exactly equal in area; density uses each cell\u2019s actual area in stations/100 km\u00B2. The map uses a spherical Lambert azimuthal equal-area projection centered on 52\u00B0N, 10\u00B0E. The continental view shows Europe; calculations retain all records.

**Distance definition.** Origins are ${fmt(f.originCount)} public, operating records with low or unknown power, including ${fmt(f.originPowerUnknown)} with unknown power. Targets are ${fmt(f.targetCount)} public, operating records with maximum rated power \u226550 kW. Nearest great-circle distances use Earth\u2019s mean radius of 6,371.0088 km, allow cross-border targets, and ignore roads and barriers. Duplicate records remain; station records are equally weighted, rather than population- or vehicle-weighted.

**Map boundary.** Only occupied cells are colored. No Europe-wide blank-area share has been constructed. Public access, operating status, and power come from snapshots with different dates, not live availability.

**Reference and independent calculations.** The [Mapular article](https://mapular.com/blog/ev-charging-deserts-europe) inspired the spatial-accessibility narrative, hexagon map, and Germany replay. Its country statistics and conclusions were not copied. All station and distance metrics were independently calculated from this project; the different source datasets prevent direct comparison of totals.

The reproducible script is analyze_accessibility.py. The report bundles the map and results and does not require a map-tile service.`}</Passage>
    </section>
    </div>;
}
