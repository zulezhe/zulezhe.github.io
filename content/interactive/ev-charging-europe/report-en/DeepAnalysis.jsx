import { EnglishEvidenceChart as EvidenceChart } from "./EnglishEvidenceChart.jsx";
import React, { useState } from 'react';
import { DataComponent, ReportSection, RichNarrative, useDataApp } from '../../data-app-public.jsx';
const pc = v => (v * 100).toFixed(1) + '%';
function Text({ id, queries, text }) { const { reviewedRows } = useDataApp(); return <ReportSection id={'deep:' + id} title="Detailed analysis" queryId={queries[0]} queryIds={queries} sourceRowsByQuery={Object.fromEntries(queries.map(q => [q, reviewedRows(q)]))} showHeading={false}><RichNarrative id={'deep:' + id + ':body'} value={text}/></ReportSection>; }
function Plot({ id, query, title, rows, x, y, series, type = 'horizontalBar', height = 360, description, stackable, fields }) { const { reviewedRows } = useDataApp(); return <EvidenceChart id={'deep:' + id} queryId={query} title={title} description={description} sourceRows={reviewedRows(query)} rows={rows || reviewedRows(query)} spec={{ type, x, y, ...(series ? { series } : {}), ...(fields ? { fields } : {}), stackable, colors: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-3)'] }} height={height}/>; }
function Spatial() {
    const { snapshot, reviewedRows } = useDataApp();
    const [mode, setMode] = useState('stations');
    const [hover, setHover] = useState(null);
    const all = reviewedRows('spatial_grid');
    const grid = all.filter(r => r.lon >= -25 && r.lon < 45 && r.lat >= 32 && r.lat < 72);
    const xy = ([lon, lat]) => [(lon + 25) * 11, (72 - lat) * 18];
    const ring = r => r.map((p, i) => (i ? 'L' : 'M') + xy(p).map(v => v.toFixed(1)).join(',')).join(' ') + 'Z';
    const color = r => mode === 'stations' ? ['#cceae0', '#9bd9c6', '#59b79d', '#267c65', '#0c4c3e'][r.stations < 10 ? 0 : r.stations < 50 ? 1 : r.stations < 200 ? 2 : r.stations < 500 ? 3 : 4] : r.stations < 10 ? '#c8d0d4' : ['#e2e8e4', '#b7decc', '#73b899', '#377c63', '#154b3b'][Math.min(4, Math.floor(r.fastShare * 5))];
    return <DataComponent id="deep:spatial-map" queryId="spatial_grid" title="European station grid · 0.5° latitude–longitude cells" kind="custom" sourceRows={all} displayRows={grid}>
    <div className="ev-selector" role="group" aria-label="Map color metric">{[['stations', "Station count"], ['fastShare', "\u226550 kW share"]].map(([k, l]) => <button key={k} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}</div>
    <div className="deep-map" data-reviewed-rows><svg viewBox="0 0 770 720" role="img" aria-label="European boundaries and charging-station grid in an equirectangular projection centered near 52° latitude">
    {snapshot.evBoundary.features.map((f, i) => <path key={i} d={(f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(poly => poly.map(ring).join(' ')).join(' ')} fill="#edf2ef" stroke="#b6c5bd" strokeWidth=".65" fillRule="evenodd"/>)}
    {grid.map((r, i) => { const [x, y] = xy([r.lon, r.lat + .5]); return <rect key={i} x={x} y={y} width={5.5} height={9} fill={color(r)} opacity=".85" onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)}><title>{r.country} · {r.lon}°, {r.lat}°：{r.stations} stations; ≥50 kW {pc(r.fastShare)}</title></rect>; })}
    {[["London", -.1, 51.5], ["Paris", 2.35, 48.86], ["Berlin", 13.4, 52.5], ["Madrid", -3.7, 40.4], ["Oslo", 10.75, 59.9], ["Rome", 12.5, 41.9]].map(([n, lon, lat]) => { const [x, y] = xy([lon, lat]); return <g key={n} pointerEvents="none"><circle cx={x} cy={y} r="3" fill="#183c31" stroke="white"/><text x={x + 7} y={y - 7} fontSize="12" fill="#14392e" stroke="white" strokeWidth="3" paintOrder="stroke">{n}</text></g>; })}
    </svg></div>
    <p className="deep-map-info" aria-live="polite">{hover ? `${hover.country} · ${hover.lon}°, ${hover.lat}°：${hover.stations.toLocaleString()} stations; \u226550 kW share: ${pc(hover.fastShare)}` : mode === 'stations' ? "Light to dark: 1\u20139 / 10\u201349 / 50\u2013199 / 200\u2013499 / \u2265500 stations" : "Light to dark: 0\u201320% / 20\u201340% / 40\u201360% / 60\u201380% / 80\u2013100%. Gray cells have fewer than 10 stations."}</p>
    <RichNarrative id="deep:spatial-caption" value={`The map shows ${grid.length} occupied cells within 25\u00B0W\u201345\u00B0E and 32\u00B0N\u201372\u00B0N; concentration calculations use all ${all.length} occupied cells. The projection is equirectangular, and 0.5\u00B0 cell areas vary with latitude. Colors compare record counts, not density per km\u00B2. Blank areas mean no records, not a confirmed absence of infrastructure.`}/>
    </DataComponent>;
}
export function DeepAnalysis() {
    const { snapshot, reviewedRows } = useDataApp();
    const f = snapshot.deepFacts;
    const cm = reviewedRows('country_cross');
    const major = cm.slice(0, 12);
    const top = major.map(r => r.name);
    const cc = reviewedRows('city_concentration');
    const op = reviewedRows('operator_concentration');
    const cohort = reviewedRows('commission_cohort');
    const size = reviewedRows('station_size');
    return <>
    <nav className="deep-toc" aria-label="Detailed analysis chapters">{[['spatial', "Spatial concentration"], ['structure', "Country composition"], ['capacity', "Station totals"], ['cities', "City networks"], ['operators', "Operators"], ['connectors', "Connector compatibility"], ['cohorts', "Commissioning cohorts"], ['quality', "Data gaps"]].map(([id, label]) => <a key={id} href={'#deep-' + id}>{label}</a>)}</nav>
    <section className="report-section" id="deep-spatial">
    <Text id="spatial" queries={['spatial_grid', 'grid_concentration']} text={`## The densest tenth of cells contains nearly seven in ten records

Reaggregating all stations into the map\u2019s 0.5\u00B0 latitude\u2013longitude grid produces ${f.gridCells.toLocaleString()} occupied cells. Ranked by record count, the top ${Math.ceil(f.gridCells * .1)} cells contain ${pc(f.top10GridShare)} of stations. Records are concentrated in a small set of spatial units.

There are also ${f.noFastGrid} occupied cells without a \u226550 kW record, representing ${pc(f.noFastGrid / f.gridCells)}. These identify candidate areas for checking, not proven charging gaps: source coverage, cell size, and road geography all matter. Switch the map to power share to see whether dense records and a high fast-power share occur together.`}/>
    <Spatial />
    <Plot id="grid-curve" query="grid_concentration" title="How many stations are in the densest cells?" x="group" y="stationShare" height={310}/>
    </section>
    <section className="report-section" id="deep-structure">
    <Text id="country-structure" queries={['country_cross', 'country_mix', 'access_mix']} text={`## Countries differ in power and access as well as counts

Cross-tabulating type and rated power within each record gives ${f.fastNumeric.toLocaleString()} records, or ${pc(f.fastNumeric / f.N)}, with maximum rated power \u226550 kW. Of those, \u2265150 kW accounts for ${f.ultra.toLocaleString()} records, or ${pc(f.ultra / f.N)}. The original highest class counts only >50 kW and cannot represent \u226550 kW supply.

The charts compare AC/DC types, the nested \u226550 kW and \u2265150 kW shares, and access conditions. The power shares cannot be added. Public-access records total ${f.public.toLocaleString()}; records that are simultaneously public, operational, and \u226550 kW total ${f.publicOperatingFast.toLocaleString()} records, representing ${pc(f.publicOperatingFast / f.N)} of all records. This is an intersection within the snapshot, not a live online rate.`}/>
    <Plot id="type-mix" query="country_mix" title="AC / DC composition in major countries" x="name" y="stationShare" series="type" type="horizontalStackedBar" height={430}/>
    <Plot id="fast-compare" query="country_cross" title="Shares of national records with ≥50 kW and ≥150 kW" rows={major.map(r => ({ ...r, "\u226550 kW share (%)": r.fastShare * 100, "\u2265150 kW share (%)": r.ultraShare * 100 }))} x="name" y="≥50 kW share (%)" fields={["\u226550 kW share (%)", "\u2265150 kW share (%)"]} stackable={false} type="horizontalBar" height={480} description="≥150 kW is a subset of ≥50 kW; these shares must not be added."/>

    <Plot id="access" query="access_mix" title="Public, restricted, and unknown access" x="name" y="stationShare" series="access" type="horizontalStackedBar" height={420}/>
    </section>
    <section className="report-section" id="deep-capacity">
    <Text id="station-size" queries={['station_size', 'country_cross']} text={`## A few large stations contain a disproportionate share of points

Only ${f.size17.stations.toLocaleString()} stations have at least 17 points, representing ${pc(f.size17.stationShare)} of all records, but containing ${f.size17.points.toLocaleString()} charging points, or ${pc(f.size17.pointShare)} of the original point total. Station counts and charging-point counts answer different questions.

Comparing mean and median points per station shows whether a few large sites raise the mean. The raw CSV also contains ${f.invalidPoints} invalid record with \u22124 points. The distribution retains it as an invalid value, not actual capacity. Totals follow the original snapshot for reconciliation; capacity conclusions need further checking against cleaned station records.`}/>
    <Plot id="size-stations" query="station_size" title="Station shares by number of points per station" x="size" y="stationShare" height={320}/>
    <Plot id="size-points" query="station_size" title="Charging-point shares by the same station-size bands" rows={size.filter(r => r.points >= 0)} x="size" y="pointShare" height={320} description="The invalid group with −4 points is excluded from the chart; the original total remains the denominator, so valid groups sum to slightly more than 100%."/>
    <Plot id="mean-median" query="country_cross" title="Points per station: mean versus median" rows={major.map(r => ({ ...r, "Mean": r.pointsPerStation, "Median": r.medianPoints }))} x="name" y="Mean" fields={["Mean", "Median"]} stackable={false} height={480}/>

    </section>
    <section className="report-section" id="deep-cities">
    <Text id="city-network" queries={['city_rank', 'city_concentration', 'country_cross']} text={`## UK records are more concentrated in a few city names than German or French records

The five largest UK city names account for ${pc(cc.find(r => r.name === "United Kingdom").top5Share)} of national records, versus ${pc(cc.find(r => r.name === "Germany").top5Share)} in Germany and ${pc(cc.find(r => r.name === "France").top5Share)} in France. This is concentration under source city-field conventions, not a standardized comparison of metropolitan areas or population coverage.

Spain\u2019s city-field completeness is only ${pc(cc.find(r => r.name === "Spain").cityKnownShare)}, so missingness affects its top-five share. France\u2019s finer municipal records also spread city rankings. The following charts separate city record counts from high-power shares; more records in a large city do not automatically mean better fast-charger provision.`}/>
    <Plot id="city-size" query="city_rank" title="Top 15 city-field names · station records" rows={reviewedRows('city_rank').slice(0, 15)} x="name" y="stations" height={500}/>
    <Plot id="city-fast" query="city_rank" title="≥50 kW shares in the same top 15 cities" rows={reviewedRows('city_rank').slice(0, 15)} x="name" y="fastShare" height={500}/>
    <Plot id="city-concentration" query="city_concentration" title="Top-five city share of national records (including missing city names in the denominator)" x="name" y="top5Share" height={430}/>
    </section>
    <section className="report-section" id="deep-operators">
    <Text id="operators" queries={['operator_rank', 'operator_concentration']} text={`## Read operator concentration alongside name completeness

Across the full dataset, the ten largest original operator names account for ${pc(f.opTop10Share)}. The Netherlands\u2019 top-five original-name share is ${pc(op.find(r => r.name === "Netherlands").top5Share)} of national records, versus ${pc(op.find(r => r.name === "Germany").top5Share)} in Germany. These measure source-name concentration, without consolidating subsidiaries, brand aliases, or roaming providers.

Only ${pc(op.find(r => r.name === "Norway").operatorKnownShare)} of Norway\u2019s records have operator names, versus ${pc(op.find(r => r.name === "Sweden").operatorKnownShare)} in Sweden. Their low top-five shares are constrained by missingness and do not establish stronger competition. Missing operator names total ${f.operatorMissing.toLocaleString()} records.`}/>
    <Plot id="op-size" query="operator_rank" title="Top 12 original operator names · station records" rows={reviewedRows('operator_rank').slice(0, 12)} x="name" y="stations" height={460}/>
    <Plot id="op-concentration" query="operator_concentration" title="Top-five original operator-name share by country" x="name" y="top5Share" height={420}/>
    <Plot id="op-completeness" query="operator_concentration" title="Operator-name completeness in the same countries" x="name" y="operatorKnownShare" height={420}/>
    </section>
    <section className="report-section" id="deep-connectors">
    <Text id="connectors" queries={['connector_cross', 'connector_mix']} text={`## High-power records strongly overlap with CCS tags, but tags are not connector counts

Among \u226550 kW records, the share carrying CCS tags is ${pc(f.conn.find(r => r.group === "\u226550 kW stations" && r.connector === 'CCS').tagShare)}; among \u2265150 kW records, it is ${pc(f.conn.find(r => r.group === "\u2265150 kW stations" && r.connector === 'CCS').tagShare)}. CCS is therefore a key field for studying high-power compatibility in this snapshot.

Type 2, CCS, CHAdeMO, Tesla, and other tags can coexist at a station. Their shares cannot be added and do not equal connector counts. Tags are split on semicolons and trimmed to avoid interpreting whitespace differences as missingness. These fields cannot establish the count or live availability of each connector type at a station.`}/>
    <Plot id="connector-coverage" query="connector_cross" title="Connector-tag coverage · denominator: all station records" x="name" y="stationShare" height={310}/>
    <Plot id="connector-power" query="connector_mix" title="Connector-tag coverage by power group (overlapping tags)" x="group" y="tagShare" series="connector" type="bar" stackable={false} height={380}/>
    </section>
    <section className="report-section" id="deep-cohorts">
    <Text id="cohorts" queries={['commission_country', 'commission_cohort', 'country_cross']} text={`## Newer German and French commissioning cohorts have higher high-power shares

Among German records commissioned through 2020, the \u226550 kW share is ${pc(cohort[0].fastShare)}, compared with ${pc(cohort[2].fastShare)} for the 2024\u20132025 cohort: a difference of ${((cohort[2].fastShare - cohort[0].fastShare) * 100).toFixed(1)} percentage points. France rises from ${pc(cohort[4].fastShare)} to ${pc(cohort[6].fastShare)}. These cohorts show composition changes among surviving records more clearly than annual counts alone.

Only records with commissioning years are compared. German years are more complete; only 33,613 of France\u2019s 59,031 records have years, and missingness may not be random. Later upgrades, exits, and registration bias can change cohort composition. The difference does not establish a causal trend in new construction. The partial 2026 cohort is shown separately.`}/>
    <Plot id="year-country" query="commission_country" title="Commissioning-year distributions for Germany and France" x="date" y="stations" series="country" type="line" height={350}/>
    <Plot id="cohort-fast" query="commission_cohort" title="≥50 kW shares by commissioning cohort" x="group" y="fastShare" height={390}/>
    </section>
    <section className="report-section" id="deep-quality">
    <Text id="quality" queries={['quality_cross', 'country_cross']} text={`## Data gaps vary by country, so global missingness is insufficient

Missing city names total ${f.cityMissing.toLocaleString()} records, or ${pc(f.cityMissing / f.N)}, concentrated in certain countries. High overall power completeness does not mean power, status, and operator information are equally complete everywhere. The chart separates major countries to identify comparisons more exposed to missing records.

Verification also found that the actual power classes are \u226411, >11\u2013\u226422, >22\u2013\u226450, and >50 kW, with the highest label inconsistent with the code. The report distinguishes the >50 kW class from the numeric \u226550 kW metric, which additionally includes ${f.fifty.toLocaleString()} records at exactly 50 kW. The raw CSV and map data have not been rewritten.`}/>
    <Plot id="missing" query="quality_cross" title="Missing power, city, and status information in major countries" x="name" y="missingShare" series="field" type="horizontalBar" height={540} stackable={false}/>
    </section>
    </>;
}
