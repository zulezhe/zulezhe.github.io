/* ============================================================
 * European EV charging station explorer · app.js
 * Progressive data: data/overview.geojson (first paint) +
 * data/stats/{CC}.json (filters/charts) + data/detail/{tile}.json
 * (individual stations, loaded only for the visible viewport).
 * ============================================================ */
(function () {
  "use strict";

  /* ---------------- 常量 ---------------- */
  var DATA = "../data/";
  var POWER_COLORS = ["#94a3b8", "#0ea5e9", "#f59e0b", "#ef4444", "#cbd5e1"];
  var POWER_LABELS = ["≤11 kW slow charging", "11–22 kW AC", "22–50 kW power class", ">50 kW power class", "Unknown power"];
  var CT_LABELS = { 0: "AC AC", 1: "DC DC", 2: "Unknown" };
  var STATUS_LABELS = ["Operational", "Under maintenance", "Planned", "Decommissioned", "Unknown status"];
  var SOURCE_LABELS = { BNetzA: "Germany BNetzA register", IRVE: "France IRVE aggregation", OCM: "Open Charge Map" };
  var CARTO_STYLES = {
    positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  };
  var DEFAULT_COUNTRIES = ["DE", "FR", "GB", "ES", "IT", "NL", "SE", "NO"];
  var STAT_RES = 0.01;      // resolution of data/stats rows (degrees)
  var DETAIL_ZOOM = 11;     // above this zoom, individual station tiles load
  var DETAIL_RES = 1;       // detail tile size (degrees)

  // data/stats/{CC}.json row indexes
  var R_LAT = 0, R_LON = 1, R_CITY = 2, R_OP = 3, R_POWER = 4, R_TYPE = 5,
      R_STATUS = 6, R_PUBLIC = 7, R_CONN = 8, R_YEAR = 9,
      R_STATIONS = 10, R_POINTS = 11, R_PSUM = 12, R_NP = 13;

  /* ---------------- State ---------------- */
  var state = {
    summary: null,
    operators: [],
    opByName: {},
    stats: {},                 // cc -> compact aggregate rows
    statsLoaded: new Set(),
    loadingStats: {},
    overview: [],              // coarse Feature[] for the first paint
    overviewByCC: {},
    detail: {},                // tileKey -> decoded Feature[]
    detailLoading: {},
    detailQueue: [],
    detailIndex: null,
    selectedCC: new Set(DEFAULT_COUNTRIES),
    filters: {
      power: new Set([0, 1, 2, 3, -1]),
      type: new Set([0, 1, 2]),
      conn: null,
      status: new Set([0, 1, 2, 3, 4]),
      publicMode: "all",
      ops: null
    },
    layers: { heatmap: false, grid: false, cities: true },
    basemap: "dark",
    countryMetric: "stations",
    charts: {},
    gridGeoms: null,
    cityMarkers: []
  };

  var map = null;
  var statusEl = null;
  var viewTimer = null;

  /* ---------------- 工具 ---------------- */
  function $(id) { return document.getElementById(id); }
  function fmt(n) { return n == null ? "—" : Math.round(n).toLocaleString("en-US"); }
  function pct(x) { return x == null ? "—" : (x * 100).toFixed(1) + "%"; }
  function setStatus(text) { if (statusEl) statusEl.textContent = text; }

  function showLoading(text) {
    $("loadingText").textContent = text || "Loading data…";
    $("loadingOverlay").classList.add("show");
  }
  function hideLoading() { $("loadingOverlay").classList.remove("show"); }

  var toastTimer = null;
  function toast(msg, ms) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, ms || 2600);
  }

  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
      return r.json();
    });
  }

  /* ---------------- 筛选 ---------------- */
  function passStats(cc, r) {
    var f = state.filters;
    if (!state.selectedCC.has(cc)) return false;
    if (!f.power.has(r[R_POWER])) return false;
    if (!f.type.has(r[R_TYPE])) return false;
    if (!f.status.has(r[R_STATUS])) return false;
    if (f.publicMode === "public" && r[R_PUBLIC] !== 1) return false;
    if (f.publicMode === "restricted" && r[R_PUBLIC] !== 0) return false;
    if (f.conn && f.conn.size) {
      var conns = r[R_CONN];
      if (!conns || !conns.length) return false;
      var ok = false;
      f.conn.forEach(function (c) { if (conns.indexOf(c) >= 0) ok = true; });
      if (!ok) return false;
    }
    if (f.ops && f.ops.size) {
      var op = r[R_OP] >= 0 ? state.operators[r[R_OP]] : null;
      if (!op || !f.ops.has(op.name)) return false;
    }
    return true;
  }

  function passFeature(p) {
    var f = state.filters;
    if (!state.selectedCC.has(p.cc)) return false;
    if (!f.power.has(p.c)) return false;
    if (!f.type.has(p.t)) return false;
    if (!f.status.has(p.s)) return false;
    if (f.publicMode === "public" && p.pb !== 1) return false;
    if (f.publicMode === "restricted" && p.pb !== 0) return false;
    if (f.conn && f.conn.size) {
      if (!p.cn) return false;
      var ok = false;
      f.conn.forEach(function (c) { if (p.cn.indexOf(c) >= 0) ok = true; });
      if (!ok) return false;
    }
    if (f.ops && f.ops.size) {
      var op = p.o >= 0 ? state.operators[p.o] : null;
      if (!op || !f.ops.has(op.name)) return false;
    }
    return true;
  }

  /* ---------------- 渐进式数据加载 ---------------- */
  function loadStats(cc) {
    if (state.stats[cc]) return Promise.resolve(state.stats[cc]);
    if (state.loadingStats[cc]) return state.loadingStats[cc];
    state.loadingStats[cc] = fetchJSON(DATA + "stats/" + cc + ".json").then(function (payload) {
      state.stats[cc] = payload.rows || [];
      state.statsLoaded.add(cc);
      delete state.loadingStats[cc];
      return state.stats[cc];
    }).catch(function (error) {
      delete state.loadingStats[cc];
      console.error(error);
      toast("Load " + cc + " failed");
      return [];
    });
    return state.loadingStats[cc];
  }

  function ensureStats(ccs, onDone) {
    var todo = [];
    ccs.forEach(function (cc) {
      if (!state.statsLoaded.has(cc) && !state.loadingStats[cc] && todo.indexOf(cc) < 0) todo.push(cc);
    });
    if (!todo.length) { onDone && onDone(); return Promise.resolve(); }

    var pendingBefore = Object.keys(state.loadingStats).length;
    setStatus("Loading " + todo.length + (todo.length === 1 ? " country…" : " countries…"));
    var cursor = 0, active = 0, finished = 0;

    return new Promise(function (resolve) {
      function pump() {
        while (active < 4 && cursor < todo.length) {
          var cc = todo[cursor++];
          active++;
          loadStats(cc).then(function () {
            active--; finished++;
            scheduleRefresh();
            pump();
          });
        }
        if (finished === todo.length) {
          if (!pendingBefore) setStatus("Station distribution");
          scheduleRefresh();
          onDone && onDone();
          resolve();
        }
      }
      pump();
    });
  }

  function loadDetailTile(key) {
    if (state.detail[key]) return;
    if (state.detailLoading[key]) return;
    if (state.detailIndex && !state.detailIndex.has(key)) return;
    state.detailLoading[key] = fetchJSON(DATA + "detail/" + key + ".json").then(function (payload) {
      state.detail[key] = decodeDetail(payload.rows || []);
      delete state.detailLoading[key];
      updateDetail();
    }).catch(function () {
      delete state.detailLoading[key];
    });
  }

  function decodeDetail(rows) {
    return rows.map(function (r) {
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [r[1], r[2]] },
        properties: {
          cc: r[0], o: r[3], p: r[4], c: r[5], t: r[6], n: r[7],
          s: r[8], nm: r[9], ct: r[10], cn: r[11], yr: r[12], pb: r[13]
        }
      };
    });
  }

  function paddedBounds(padding) {
    var b = map.getBounds();
    return {
      south: b.getSouth() - padding,
      north: b.getNorth() + padding,
      west: b.getWest() - padding,
      east: b.getEast() + padding
    };
  }

  function tileKeysForBounds(bounds) {
    var south = Math.max(-85, bounds.south);
    var north = Math.min(85, bounds.north);
    var keys = [];
    for (var lat = Math.floor(south / DETAIL_RES); lat <= Math.floor(north / DETAIL_RES); lat++) {
      for (var lon = Math.floor(bounds.west / DETAIL_RES); lon <= Math.floor(bounds.east / DETAIL_RES); lon++) {
        keys.push(lat + "_" + lon);
      }
    }
    return keys;
  }

  function requestDetail() {
    if (!map || map.getZoom() < DETAIL_ZOOM) return;
    var keys = tileKeysForBounds(paddedBounds(0.25));
    // Only the viewport matters; cap the burst so a fast zoom keeps the map responsive.
    keys = keys.filter(function (key) {
      return !state.detail[key] && !state.detailLoading[key] &&
        (!state.detailIndex || state.detailIndex.has(key));
    });
    keys.sort(function (a, b) {
      var ca = tileDistance(a), cb = tileDistance(b);
      return ca - cb;
    });
    keys.slice(0, 12).forEach(loadDetailTile);
  }

  function tileDistance(key) {
    var parts = key.split("_");
    var lat = (Number(parts[0]) + 0.5) * DETAIL_RES;
    var lon = (Number(parts[1]) + 0.5) * DETAIL_RES;
    var center = map.getCenter();
    return Math.pow(lat - center.lat, 2) + Math.pow(lon - center.lng, 2);
  }

  /* ---------------- 聚合统计 ---------------- */
  function aggregate() {
    var agg = {
      stations: 0, points: 0, sumPower: 0, knownPoints: 0,
      ops: {}, ccs: {}, power: {}, type: {}, status: {},
      conn: {}, year: {}, cities: {}
    };
    state.selectedCC.forEach(function (cc) {
      var rows = state.stats[cc];
      if (!rows) return;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!passStats(cc, r)) continue;
        var n = r[R_STATIONS];
        agg.stations += n;
        agg.points += r[R_POINTS];
        agg.sumPower += r[R_PSUM];
        agg.knownPoints += r[R_NP];
        if (r[R_OP] >= 0 && state.operators[r[R_OP]]) {
          var opn = state.operators[r[R_OP]].name;
          agg.ops[opn] = (agg.ops[opn] || 0) + n;
        }
        agg.ccs[cc] = (agg.ccs[cc] || 0) + n;
        agg.power[r[R_POWER]] = (agg.power[r[R_POWER]] || 0) + n;
        agg.type[r[R_TYPE]] = (agg.type[r[R_TYPE]] || 0) + n;
        agg.status[r[R_STATUS]] = (agg.status[r[R_STATUS]] || 0) + n;
        if (r[R_CONN]) r[R_CONN].forEach(function (c) { agg.conn[c] = (agg.conn[c] || 0) + n; });
        if (r[R_YEAR]) agg.year[r[R_YEAR]] = (agg.year[r[R_YEAR]] || 0) + n;
        if (r[R_CITY]) {
          var ck = cc + "|" + r[R_CITY];
          if (!agg.cities[ck]) agg.cities[ck] = { n: 0, lat: 0, lon: 0, cc: cc, city: r[R_CITY] };
          var c = agg.cities[ck];
          c.n += n;
          c.lat += (r[R_LAT] + 0.5) * STAT_RES * n;
          c.lon += (r[R_LON] + 0.5) * STAT_RES * n;
        }
      }
    });
    Object.keys(agg.cities).forEach(function (k) {
      var c = agg.cities[k];
      c.lat /= c.n; c.lon /= c.n;
    });
    return agg;
  }

  /* ---------------- 地图数据 ---------------- */
  function cellResolution() {
    var zoom = map ? map.getZoom() : 3;
    if (zoom < 6) return 1;
    if (zoom < 8) return 0.5;
    if (zoom < 10) return 0.1;
    return 0.02;
  }

  function buildCellFeatures() {
    if (!map) return { type: "FeatureCollection", features: [] };
    if (map.getZoom() >= DETAIL_ZOOM) return { type: "FeatureCollection", features: [] };

    var res = cellResolution();
    var bounds = map.getZoom() >= 5 ? paddedBounds(0.6) : null;
    var groups = {};

    function add(n, pts, powerClass, lat, lon) {
      if (bounds && (lat < bounds.south || lat > bounds.north ||
        lon < bounds.west || lon > bounds.east)) return;
      var key = Math.floor(lat / res) + "_" + Math.floor(lon / res);
      var g = groups[key];
      if (!g) {
        g = groups[key] = {
          n: 0, pts: 0, pw: [0, 0, 0, 0, 0],
          lat: (Math.floor(lat / res) + 0.5) * res,
          lon: (Math.floor(lon / res) + 0.5) * res
        };
      }
      g.n += n;
      g.pts += pts;
      g.pw[powerClass < 0 ? 4 : powerClass] = (g.pw[powerClass < 0 ? 4 : powerClass] || 0) + n;
    }

    state.selectedCC.forEach(function (cc) {
      var rows = state.stats[cc];
      if (rows) {
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          if (!passStats(cc, r)) continue;
          add(r[R_STATIONS], r[R_POINTS], r[R_POWER],
            (r[R_LAT] + 0.5) * STAT_RES, (r[R_LON] + 0.5) * STAT_RES);
        }
        return;
      }
      // Until a country's compact stats arrive, fall back to its overview cells.
      var coarse = state.overviewByCC[cc] || [];
      for (var j = 0; j < coarse.length; j++) {
        var p = coarse[j].properties;
        add(p.n, p.pts, p.c, coarse[j].geometry.coordinates[1], coarse[j].geometry.coordinates[0]);
      }
    });

    var features = [];
    Object.keys(groups).forEach(function (key) {
      var g = groups[key];
      var dominant = 4, best = -1;
      g.pw.forEach(function (value, index) { if (value > best) { best = value; dominant = index; } });
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [g.lon, g.lat] },
        properties: {
          n: g.n, pts: g.pts, c: dominant,
          label: g.n >= 1000 ? (g.n >= 10000 ? Math.round(g.n / 1000) : (g.n / 1000).toFixed(1)) + "k" : String(g.n)
        }
      });
    });
    return { type: "FeatureCollection", features: features };
  }

  function buildDetailFeatures() {
    var all = [];
    Object.keys(state.detail).forEach(function (key) {
      var features = state.detail[key];
      for (var i = 0; i < features.length; i++) {
        if (passFeature(features[i].properties)) all.push(features[i]);
      }
    });
    return all;
  }

  function updateCells() {
    if (!map || !map.getSource("cells")) return;
    map.getSource("cells").setData(buildCellFeatures());
  }

  function updateDetail() {
    if (!map || !map.getSource("stations")) return;
    map.getSource("stations").setData({ type: "FeatureCollection", features: buildDetailFeatures() });
  }

  /* ---------------- 地图 ---------------- */
  function localStyle() {
    return {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf",
      sources: {
        boundary: { type: "geojson", data: DATA + "europe_boundary.geojson" }
      },
      layers: [
        { id: "bg", type: "background", paint: { "background-color": "#0b171c" } },
        { id: "country-fill", type: "fill", source: "boundary",
          paint: { "fill-color": "#15292e", "fill-opacity": 1 } },
        { id: "country-line", type: "line", source: "boundary",
          paint: { "line-color": "#335057", "line-width": 0.8 } }
      ]
    };
  }

  function initMap() {
    statusEl = document.querySelector(".view-status");
    $("btnOverview").addEventListener("click", function () { map.easeTo({center: [10.5, 50.2], zoom: 3.3, bearing: 0, pitch: 0, duration: 800}); });
    map = new maplibregl.Map({
      container: "map",
      style: CARTO_STYLES[state.basemap],
      center: [10.5, 50.2],
      zoom: 3.3,
      maxZoom: 17
    });
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

    map.on("error", function (e) {
      if (e && e.error && /Failed to fetch|NetworkError|Load failed/i.test(String(e.error.message || ""))) {
        if (state.basemap !== "local") {
          toast("Online basemap unavailable, switched to the offline outline basemap");
          switchBasemap("local");
        }
      }
    });

    map.on("load", function () {
      addDataLayers();
      requestDetail();
    });

    map.on("moveend", function () {
      clearTimeout(viewTimer);
      viewTimer = setTimeout(function () {
        updateCells();
        requestDetail();
      }, 120);
    });

    // 点击聚合单元 -> 放大
    map.on("click", "cells-circle", function (e) {
      var feature = e.features[0];
      var p = feature.properties;
      map.easeTo({
        center: feature.geometry.coordinates,
        zoom: Math.min(map.getZoom() + 1.8, DETAIL_ZOOM + 1),
        duration: 600
      });
      new maplibregl.Popup({ closeButton: true, maxWidth: "260px" })
        .setLngLat(feature.geometry.coordinates)
        .setHTML('<div class="popup-title">Aggregated area</div>' +
          '<div class="popup-row"><span>Stations</span><b>' + fmt(p.n) + "</b></div>" +
          '<div class="popup-row"><span>Charging points</span><b>' + fmt(p.pts) + "</b></div>" +
          '<div class="popup-row"><span>Power class</span><b>' + POWER_LABELS[p.c < 0 ? 4 : p.c] + "</b></div>")
        .addTo(map);
    });

    // 点击聚类 -> 放大
    map.on("click", "clusters", function (e) {
      var f = e.features[0];
      map.getSource("stations").getClusterExpansionZoom(f.properties.cluster_id).then(function (zoom) {
        map.easeTo({ center: f.geometry.coordinates, zoom: Math.min(zoom + 0.4, 16), duration: 520 });
      }).catch(function () {});
    });

    // 点击单点 -> 弹窗
    map.on("click", "stations-point", function (e) {
      var p = e.features[0].properties;
      var opName = p.o >= 0 && state.operators[p.o] ? state.operators[p.o].name : "Unknown operator";
      var conns = (p.cn || []).map(function (c) { return '<span class="popup-badge">' + esc(c) + "</span>"; }).join("");
      var html =
        '<div class="popup-title">' + esc(p.nm || p.ct || "Charging stations") + "</div>" +
        '<div class="popup-row"><span>Operator</span><b>' + esc(opName) + "</b></div>" +
        '<div class="popup-row"><span>Location</span><b>' + esc(p.ct || "—") + " · " + esc(p.cc) + "</b></div>" +
        '<div class="popup-row"><span>Rated power</span><b>' + (p.p >= 0 ? p.p + " kW" : "Unknown") + "</b></div>" +
        '<div class="popup-row"><span>Type</span><b>' + CT_LABELS[p.t] + " · " + POWER_LABELS[p.c < 0 ? 4 : p.c] + "</b></div>" +
        '<div class="popup-row"><span>Charging points</span><b>' + (p.n || 1) + "</b></div>" +
        '<div class="popup-row"><span>Status</span><b>' + STATUS_LABELS[p.s] + (p.pb === 1 ? " · public" : p.pb === 0 ? " · Restricted access" : "") + "</b></div>" +
        (p.yr ? '<div class="popup-row"><span>Commissioned</span><b>' + p.yr + "</b></div>" : "") +
        (conns ? '<div style="margin-top:6px">' + conns + "</div>" : "") +
        '<div class="popup-src">Data sources: ' + esc(SOURCE_LABELS[countrySource(p.cc)] || p.cc) + " · OCM/Official open data</div>";
      new maplibregl.Popup({ maxWidth: "300px", closeButton: true })
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(html)
        .addTo(map);
    });

    // 网格弹窗
    map.on("click", "grid-fill", function (e) {
      var p = e.features[0].properties;
      new maplibregl.Popup({ closeButton: true })
        .setLngLat(e.lngLat)
        .setHTML('<div class="popup-title">0.5° grid density</div>' +
          '<div class="popup-row"><span>Stations in cell</span><b>' + fmt(p.n) + "</b></div>" +
          '<div class="popup-row"><span>Main country</span><b>' + esc(p.cc) + "</b></div>")
        .addTo(map);
    });
    map.on("mouseenter", "grid-fill", function () { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "grid-fill", function () { map.getCanvas().style.cursor = ""; });

    ["cells-circle", "clusters", "stations-point"].forEach(function (lyr) {
      map.on("mouseenter", lyr, function () { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", lyr, function () { map.getCanvas().style.cursor = ""; });
    });
  }

  function countrySource(cc) {
    if (!state.summary) return "OCM";
    for (var i = 0; i < state.summary.countries.length; i++) {
      if (state.summary.countries[i].cc === cc) return state.summary.countries[i].source;
    }
    return "OCM";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function applyMapFilter() {
    if (!map) return;
    updateCells();
    updateDetail();
    updateGridLayer();
    updateCityMarkers();
  }

  function switchBasemap(bm) {
    state.basemap = bm;
    document.querySelectorAll("#basemapRow button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.bm === bm);
    });
    if (bm === "local") {
      map.setStyle(localStyle());
    } else {
      map.setStyle(CARTO_STYLES[bm]);
    }
    map.once("styledata", function () { setTimeout(function () { addDataLayers(); }, 60); });
  }

  function addDataLayers(attempt) {
    if (map.getLayer("cells-circle")) return;
    try {
      if (!map.getSource("cells")) {
        map.addSource("cells", { type: "geojson", data: buildCellFeatures() });
      }
      if (!map.getSource("stations")) {
        map.addSource("stations", {
          type: "geojson",
          data: { type: "FeatureCollection", features: buildDetailFeatures() },
          cluster: true,
          clusterRadius: 45,
          clusterMaxZoom: 13,
          tolerance: 1.2
        });
      }
      if (state.gridGeoms && !map.getSource("grid")) {
        map.addSource("grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      }
      var before = map.getLayer("waterway-label") ? "waterway-label" : undefined;

      if (state.gridGeoms && !map.getLayer("grid-fill")) {
        map.addLayer({ id: "grid-fill", type: "fill", source: "grid",
          layout: { visibility: state.layers.grid ? "visible" : "none" },
          paint: {
            "fill-color": ["interpolate", ["linear"], ["get", "n"],
              1, "#e0e7ff", 10, "#a5b4fc", 50, "#818cf8", 200, "#6366f1", 500, "#4338ca", 1200, "#312e81"],
            "fill-opacity": ["interpolate", ["linear"], ["get", "n"],
              1, 0.10, 50, 0.18, 200, 0.26, 500, 0.32, 1200, 0.38]
          } }, before);
        map.addLayer({ id: "grid-line", type: "line", source: "grid",
          layout: { visibility: state.layers.grid ? "visible" : "none" },
          paint: { "line-color": "#6366f1", "line-width": 0.4, "line-opacity": 0.5 } }, before);
      }

      // Density remains available before individual tiles load.
      map.addLayer({
        id: "cells-heat", type: "heatmap", source: "cells", maxzoom: DETAIL_ZOOM,
        layout: { visibility: state.layers.heatmap ? "visible" : "none" },
        paint: {
          "heatmap-weight": ["coalesce", ["get", "n"], 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 1.2, 10, 2.4],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(59,130,246,0)", 0.15, "#3b82f6", 0.35, "#22d3ee",
            0.55, "#facc15", 0.75, "#f97316", 1, "#dc2626"],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 18, 8, 26, 13, 34],
          "heatmap-opacity": 0.8
        }
      }, before);

      // Aggregated cells: first paint and mid-zoom, until individual tiles load.
      map.addLayer({
        id: "cells-circle", type: "circle", source: "cells", maxzoom: DETAIL_ZOOM,
        paint: {
          "circle-color": ["case",
            ["==", ["get", "c"], 0], POWER_COLORS[0],
            ["==", ["get", "c"], 1], POWER_COLORS[1],
            ["==", ["get", "c"], 2], POWER_COLORS[2],
            ["==", ["get", "c"], 3], POWER_COLORS[3],
            POWER_COLORS[4]],
          "circle-radius": ["interpolate", ["linear"], ["get", "n"],
            1, 5, 10, 9, 100, 15, 1000, 23, 5000, 32, 20000, 42],
          "circle-opacity": 0.82,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(255,255,255,0.35)"
        }
      }, before);

      map.addLayer({
        id: "cells-count", type: "symbol", source: "cells", minzoom: 4, maxzoom: DETAIL_ZOOM,
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Regular"],
          "text-size": 11
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.3)",
          "text-halo-width": 0.6
        }
      }, before);

      // Individual stations, only requested for the visible viewport above DETAIL_ZOOM.
      map.addLayer({
        id: "stations-heat", type: "heatmap", source: "stations", minzoom: DETAIL_ZOOM,
        layout: { visibility: state.layers.heatmap ? "visible" : "none" },
        maxzoom: 15,
        paint: {
          "heatmap-weight": ["coalesce", ["get", "n"], 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 1.2, 10, 2.4],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(59,130,246,0)", 0.15, "#3b82f6", 0.35, "#22d3ee",
            0.55, "#facc15", 0.75, "#f97316", 1, "#dc2626"],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 14, 8, 22, 13, 30],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.85, 15, 0]
        }
      }, before);

      map.addLayer({
        id: "clusters", type: "circle", source: "stations", minzoom: DETAIL_ZOOM,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"],
            "#90e4ca", 10, "#54caaa", 50, "#24a78a", 200, "#147d6b"],
          "circle-radius": ["step", ["get", "point_count"],
            12, 10, 16, 50, 21, 200, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(139,237,210,0.45)",
          "circle-opacity": 0.82
        }
      }, before);

      map.addLayer({
        id: "cluster-count", type: "symbol", source: "stations", minzoom: DETAIL_ZOOM,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Regular"],
          "text-size": 12
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.25)",
          "text-halo-width": 0.6
        }
      }, before);

      map.addLayer({
        id: "stations-point", type: "circle", source: "stations", minzoom: DETAIL_ZOOM,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["case",
            ["==", ["get", "c"], 0], POWER_COLORS[0],
            ["==", ["get", "c"], 1], POWER_COLORS[1],
            ["==", ["get", "c"], 2], POWER_COLORS[2],
            ["==", ["get", "c"], 3], POWER_COLORS[3],
            POWER_COLORS[4]],
          "circle-radius": ["interpolate", ["linear"], ["zoom"],
            8, 2.6, 12, 4.2, 15, 6.5],
          "circle-stroke-width": 0.8,
          "circle-stroke-color": "rgba(255,255,255,0.75)"
        }
      }, before);

      applyMapFilter();
    } catch (err) {
      console.warn("addDataLayers retry:", err);
      if ((attempt || 0) < 4) setTimeout(function () { addDataLayers((attempt || 0) + 1); }, 500);
    }
  }

  function updateGridLayer() {
    if (!map || !map.getSource("grid") || !state.layers.grid) return;
    var cells = {};
    state.selectedCC.forEach(function (cc) {
      var rows = state.stats[cc];
      if (rows) {
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          if (!passStats(cc, r)) continue;
          var key = Math.floor((r[R_LAT] + 0.5) * STAT_RES * 2) / 2 + "/" + Math.floor((r[R_LON] + 0.5) * STAT_RES * 2) / 2;
          if (!cells[key]) cells[key] = { n: 0, cc: cc };
          cells[key].n += r[R_STATIONS];
        }
        return;
      }
      var coarse = state.overviewByCC[cc] || [];
      for (var j = 0; j < coarse.length; j++) {
        var p = coarse[j].properties;
        var g = coarse[j].geometry.coordinates;
        var gk = Math.floor(g[1] * 2) / 2 + "/" + Math.floor(g[0] * 2) / 2;
        if (!cells[gk]) cells[gk] = { n: 0, cc: cc };
        cells[gk].n += p.n;
      }
    });
    var feats = [];
    Object.keys(cells).forEach(function (k) {
      if (!state.gridGeoms[k]) return;
      feats.push({ type: "Feature",
        geometry: { type: "Polygon", coordinates: state.gridGeoms[k] },
        properties: { n: cells[k].n, cc: cells[k].cc } });
    });
    map.getSource("grid").setData({ type: "FeatureCollection", features: feats });
  }

  function updateCityMarkers() {
    state.cityMarkers.forEach(function (m) { m.remove(); });
    state.cityMarkers = [];
    if (!map || !state.layers.cities) return;
    var agg = aggregate();
    var cities = Object.keys(agg.cities).map(function (k) { return agg.cities[k]; });
    cities.sort(function (a, b) { return b.n - a.n; });
    cities = cities.slice(0, 15).filter(function (c) { return c.n >= 5; });
    cities.forEach(function (c) {
      var el = document.createElement("div");
      el.className = "city-marker";
      el.innerHTML = '<span class="city-dot"></span><span class="city-tag">' +
        esc(c.city) + " · " + fmt(c.n) + "</span>";
      el.addEventListener("click", function () {
        map.easeTo({ center: [c.lon, c.lat], zoom: 11, duration: 700 });
      });
      var mk = new maplibregl.Marker({ element: el }).setLngLat([c.lon, c.lat]).addTo(map);
      state.cityMarkers.push(mk);
    });
  }

  /* ---------------- 图表 ---------------- */
  function initCharts() {
    state.charts.countries = echarts.init($("chartCountries"));
    state.charts.power = echarts.init($("chartPower"));
    state.charts.cities = echarts.init($("chartCities"));
    state.charts.operators = echarts.init($("chartOperators"));
    state.charts.connectors = echarts.init($("chartConnectors"));
    state.charts.timeline = echarts.init($("chartTimeline"));
    window.addEventListener("resize", function () {
      Object.keys(state.charts).forEach(function (k) { state.charts[k].resize(); });
    });
  }

  function barOption(cats, vals, color, horizontal, unit) {
    var maxV = Math.max.apply(null, vals.concat([1]));
    return {
      grid: { left: horizontal ? 4 : 34, right: horizontal ? 46 : 10, top: 6, bottom: 4, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" },
        valueFormatter: function (v) { return fmt(v) + (unit || ""); } },
      xAxis: horizontal
        ? { type: "value", max: maxV * 1.12, splitLine: { lineStyle: { color: "#263a41" } },
            axisLabel: { color: "#98adb4", fontSize: 10 } }
        : { type: "category", data: cats, axisLabel: { color: "#c3d5d9", fontSize: 10, interval: 0,
              rotate: vals.length > 8 ? 38 : 0 },
            axisTick: { show: false }, axisLine: { lineStyle: { color: "#263a41" } } },
      yAxis: horizontal
        ? { type: "category", data: cats, inverse: true,
            axisLabel: { color: "#c3d5d9", fontSize: 10.5 }, axisTick: { show: false },
            axisLine: { lineStyle: { color: "#263a41" } } }
        : { type: "value", splitLine: { lineStyle: { color: "#263a41" } },
            axisLabel: { color: "#98adb4", fontSize: 10 } },
      series: [{
        type: "bar", data: vals, barMaxWidth: horizontal ? 13 : 22,
        itemStyle: { color: color, borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
        label: { show: true, position: horizontal ? "right" : "top",
          fontSize: 10, color: "#b2c8ce",
          formatter: function (p) { return fmt(p.value); } }
      }]
    };
  }

  function renderStatCards(agg) {
    var opCount = Object.keys(agg.ops).length;
    var dc = (agg.type[1] || 0);
    var total = (agg.type[0] || 0) + dc + (agg.type[2] || 0);
    var fast = (agg.power[3] || 0);
    var knownPower = agg.stations - (agg.power[-1] || 0);
    var loadedCC = 0;
    state.selectedCC.forEach(function (cc) { if (state.statsLoaded.has(cc)) loadedCC++; });
    var cards = [
      { v: fmt(agg.stations), k: "Stations (filtered)" },
      { v: fmt(agg.points), k: "Charging points" },
      { v: fmt(Object.keys(agg.ccs).length), k: "Countries / territories" },
      { v: fmt(opCount), k: "Operator names" },
      { v: pct(total ? dc / total : null), k: "DC share" },
      { v: pct(agg.stations ? fast / agg.stations : null), k: ">50kW class share" },
      { v: agg.knownPoints ? (agg.sumPower / agg.knownPoints).toFixed(1) + " kW" : "—", k: "Mean power (point-weighted)" },
      { v: pct(agg.stations ? knownPower / agg.stations : null), k: "Known power" },
      { v: fmt(loadedCC), k: "Loaded countries" }
    ];
    $("statCards").innerHTML = cards.map(function (c) {
      return '<div class="stat-card"><div class="v">' + c.v + '</div><div class="k">' + c.k + "</div></div>";
    }).join("");
  }

  function renderCharts(agg) {
    var cs = state.summary.countries.filter(function (c) { return agg.ccs[c.cc]; });
    var metric = state.countryMetric;
    var rows = cs.map(function (c) {
      var v = metric === "stations" ? agg.ccs[c.cc] : c[metric];
      return { cc: c.cc, name: c.name, v: v };
    }).filter(function (r) { return r.v != null; });
    rows.sort(function (a, b) { return b.v - a.v; });
    rows = rows.slice(0, 15);
    state.charts.countries.setOption(barOption(
      rows.map(function (r) { return r.cc + " " + r.name; }),
      rows.map(function (r) { return r.v; }),
      "#69d9b8", true,
      metric === "per_million" ? " stations/million people" : metric === "per_1000km2" ? " stations/1,000 km²" : " stations"
    ), true);

    var pwData = [0, 1, 2, 3, -1].map(function (i) {
      return { name: POWER_LABELS[i < 0 ? 4 : i], value: agg.power[i] || 0,
        itemStyle: { color: POWER_COLORS[i < 0 ? 4 : i] } };
    });
    state.charts.power.setOption({
      tooltip: { trigger: "item", formatter: "{b}: {c} stations ({d}%)" },
      legend: { bottom: 0, left: "center", itemWidth: 10, itemHeight: 8,
        textStyle: { fontSize: 10, color: "#98adb4" } },
      series: [{
        type: "pie", radius: ["49%", "69%"], center: ["50%", "44%"],
        avoidLabelOverlap: true,
        label: { fontSize: 10.5, color: "#c3d5d9", formatter: "{b}\n{c} ({d}%)" },
        itemStyle: { borderColor: "#142329", borderWidth: 2 },
        data: pwData
      }],
      graphic: { type: "text", left: "center", top: "40%",
        style: { text: fmt(agg.stations) + "\nStations", textAlign: "center", fontSize: 18,
          fill: "#c3d5d9", fontWeight: 700, lineHeight: 18 } }
    }, true);

    var cities = Object.keys(agg.cities).map(function (k) { return agg.cities[k]; });
    cities.sort(function (a, b) { return b.n - a.n; });
    cities = cities.slice(0, 15);
    state.charts.cities.setOption(barOption(
      cities.map(function (c) { return c.city + " (" + c.cc + ")"; }),
      cities.map(function (c) { return c.n; }),
      "#6ab9d1", true, " stations"
    ), true);
    state.charts.cities.off("click");
    state.charts.cities.on("click", function (params) {
      var c = cities[params.dataIndex];
      if (c) map.easeTo({ center: [c.lon, c.lat], zoom: 11.5, duration: 700 });
    });

    var ops = Object.keys(agg.ops).map(function (k) { return { name: k, v: agg.ops[k] }; });
    ops.sort(function (a, b) { return b.v - a.v; });
    ops = ops.slice(0, 15);
    state.charts.operators.setOption(barOption(
      ops.map(function (o) { return o.name.length > 22 ? o.name.slice(0, 21) + "…" : o.name; }),
      ops.map(function (o) { return o.v; }),
      "#58bda3", true, " stations"
    ), true);

    var conns = Object.keys(agg.conn).map(function (k) { return { name: k, v: agg.conn[k] }; });
    conns.sort(function (a, b) { return b.v - a.v; });
    conns = conns.slice(0, 10);
    state.charts.connectors.setOption(barOption(
      conns.map(function (c) { return c.name; }),
      conns.map(function (c) { return c.v; }),
      "#a99acb", false, " stations"
    ), true);

    var years = Object.keys(agg.year).map(Number).sort(function (a, b) { return a - b; });
    var yMin = years.length ? Math.min(2010, years[0]) : 2010;
    var yMax = years.length ? Math.max(2026, years[years.length - 1]) : 2026;
    var ycats = [], yvals = [];
    for (var y = yMin; y <= yMax; y++) { ycats.push(y); yvals.push(agg.year[y] || 0); }
    state.charts.timeline.setOption(barOption(ycats, yvals, "#f59e0b", false, " stations"), true);
  }

  function refreshAll() {
    if (!state.summary) return;
    var agg = aggregate();
    renderStatCards(agg);
    renderCharts(agg);
  }

  var refreshTimer = null;
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      applyMapFilter();
      refreshAll();
    }, 120);
  }

  /* ---------------- 筛选面板构建 ---------------- */
  function buildSourceBadges() {
    $("sourceBadges").innerHTML = state.summary.sources.map(function (s) {
      return '<span class="src-badge" title="' + esc(s.url) + ' · ' + esc(s.license) + '">' +
        esc(s.id) + " · " + esc(s.snapshot) + "</span>";
    }).join("");
    $("dataNotes").innerHTML = state.summary.sources.map(function (s) {
      return '<div class="note-src"><b>' + esc(s.name) + "</b> (" + esc(s.license) +
        "; snapshot " + esc(s.snapshot) + "; coverage " + esc(s.covers) + ")<br>" +
        '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.url) + "</a></div>";
    }).join("") + '<div class="note-src">Population / land area: World Bank (2023). Basemap: © OpenStreetMap contributors © CARTO. ' +
      "Counts refer to station records; a station may contain multiple charging points.</div>";
  }

  function buildCountryList() {
    var box = $("ccList");
    var kw = $("ccSearch").value.trim().toLowerCase();
    var html = "";
    state.summary.countries.forEach(function (c) {
      if (kw && c.name.toLowerCase().indexOf(kw) < 0 && c.cc.toLowerCase().indexOf(kw) < 0 &&
          c.name_en.toLowerCase().indexOf(kw) < 0) return;
      var on = state.selectedCC.has(c.cc);
      html += '<label class="cc-item' + (on ? "" : " disabled") + '">' +
        '<input type="checkbox" data-cc="' + c.cc + '"' + (on ? " checked" : "") + ">" +
        '<span class="cc-code">' + c.cc + "</span>" +
        '<span class="cc-name">' + esc(c.name) + "</span>" +
        '<span class="cc-count">' + fmt(c.stations) + "</span></label>";
    });
    box.innerHTML = html || '<div class="op-empty">No matching countries</div>';
    box.querySelectorAll("input[data-cc]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var cc = inp.dataset.cc;
        if (inp.checked) {
          state.selectedCC.add(cc);
          loadStats(cc).then(scheduleRefresh);
        } else {
          state.selectedCC.delete(cc);
          scheduleRefresh();
        }
        buildCountryList();
      });
    });
  }

  function buildCheckList(elId, items, selected, onChange) {
    var box = $(elId);
    box.innerHTML = items.map(function (it) {
      var on = selected.has(it.v);
      return '<label><input type="checkbox" data-v="' + it.v + '"' + (on ? " checked" : "") + ">" +
        (it.color ? '<span class="dot" style="background:' + it.color + '"></span>' : "") +
        "<span>" + esc(it.label) + (it.count != null ? ' <small style="color:#9ca3af">(' + fmt(it.count) + ")</small>" : "") +
        "</span></label>";
    }).join("");
    box.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var v = inp.dataset.v;
        var val = isNaN(Number(v)) ? v : Number(v);
        if (inp.checked) selected.add(val); else selected.delete(val);
        onChange();
      });
    });
  }

  function renderSelectedOps() {
    var selectedBox = $("opSelected");
    var f = state.filters.ops;
    if (!f || !f.size) {
      selectedBox.innerHTML = '<span style="color:#9ca3af;font-size:11.5px">None selected (all by default)</span>';
      return;
    }
    selectedBox.innerHTML = "";
    f.forEach(function (name) {
      var chip = document.createElement("span");
      chip.className = "op-chip";
      chip.textContent = name;
      chip.title = "Click to remove";
      chip.addEventListener("click", function () { f.delete(name); renderSelectedOps(); scheduleRefresh(); });
      selectedBox.appendChild(chip);
    });
  }

  function buildOperatorPanel() {
    $("opTotal").textContent = fmt(state.operators.length);
    var input = $("opSearch");
    var results = $("opResults");
    renderSelectedOps();

    input.addEventListener("input", function () {
      var kw = input.value.trim().toLowerCase();
      if (!kw) { results.classList.remove("show"); results.innerHTML = ""; return; }
      var hits = state.operators.filter(function (o) {
        return o.name.toLowerCase().indexOf(kw) >= 0;
      }).slice(0, 50);
      if (!hits.length) {
        results.innerHTML = '<div class="op-empty">No matching operators</div>';
      } else {
        results.innerHTML = hits.map(function (o) {
          return '<div class="op-result-item" data-op="' + esc(o.name) + '">' +
            '<span class="op-n">' + esc(o.name) + '</span><span class="op-c">' + fmt(o.stations) + " stations</span></div>";
        }).join("");
      }
      results.classList.add("show");
      results.querySelectorAll(".op-result-item").forEach(function (item) {
        item.addEventListener("click", function () {
          var name = item.dataset.op;
          if (!state.filters.ops) state.filters.ops = new Set();
          state.filters.ops.add(name);
          input.value = "";
          results.classList.remove("show");
          renderSelectedOps();
          scheduleRefresh();
        });
      });
    });
    input.addEventListener("blur", function () {
      setTimeout(function () { results.classList.remove("show"); }, 180);
    });
  }

  /* ---------------- Reset ---------------- */
  function resetFilters() {
    state.filters.power = new Set([0, 1, 2, 3, -1]);
    state.filters.type = new Set([0, 1, 2]);
    state.filters.conn = null;
    state.filters.status = new Set([0, 1, 2, 3, 4]);
    state.filters.publicMode = "all";
    state.filters.ops = null;
    state.selectedCC = new Set(DEFAULT_COUNTRIES);
    buildCountryList();
    ensureStats(Array.from(state.selectedCC));
    buildCheckList("powerFilter", powerItems(), state.filters.power, scheduleRefresh);
    buildCheckList("typeFilter", typeItems(), state.filters.type, scheduleRefresh);
    buildCheckList("connFilter", connItems(), state.filters.conn || new Set(), function () {
      var sel = new Set();
      document.querySelectorAll("#connFilter input:checked").forEach(function (i) { sel.add(i.dataset.v); });
      state.filters.conn = sel.size ? sel : null;
      scheduleRefresh();
    });
    buildCheckList("statusFilter", statusItems(), state.filters.status, scheduleRefresh);
    buildCheckList("publicFilter", [
      { v: "all", label: "All (unrestricted)" }, { v: "public", label: "Public access" }, { v: "restricted", label: "Restricted access" }
    ], new Set(["all"]), function () {
      var v = document.querySelector('#publicFilter input:checked');
      state.filters.publicMode = v ? v.dataset.v : "all";
      scheduleRefresh();
    });
    renderSelectedOps();
    var panel = document.querySelector("#filterPanel");
    if (panel) panel.scrollTop = 0;
    scheduleRefresh();
  }

  function powerItems() {
    var pc = {};
    state.summary.power_classes.forEach(function (p) { pc[p.class] = p.stations; });
    return [0, 1, 2, 3, -1].map(function (i) {
      return { v: i, label: POWER_LABELS[i < 0 ? 4 : i], color: POWER_COLORS[i < 0 ? 4 : i], count: pc[i] };
    });
  }
  function typeItems() {
    return state.summary.charge_types.map(function (t, i) {
      return { v: i === 0 ? 0 : i === 1 ? 1 : 2, label: t.type, count: t.stations };
    });
  }
  function connItems() {
    return state.summary.connectors.map(function (c) {
      return { v: c.name, label: c.name, count: c.stations };
    });
  }
  function statusItems() {
    return state.summary.status.map(function (s, i) {
      return { v: i, label: s.label, count: s.stations };
    });
  }

  function bindEvents() {
    $("btnReset").addEventListener("click", resetFilters);
    $("ccSearch").addEventListener("input", buildCountryList);
    $("btnCCAll").addEventListener("click", function () {
      var ccs = state.summary.countries.map(function (c) { return c.cc; });
      state.selectedCC = new Set(ccs);
      buildCountryList();
      ensureStats(ccs);
    });
    $("btnCCNone").addEventListener("click", function () {
      state.selectedCC = new Set();
      buildCountryList();
      scheduleRefresh();
    });
    $("lyHeatmap").addEventListener("change", function () {
      state.layers.heatmap = this.checked;
      var visibility = this.checked ? "visible" : "none";
      ["cells-heat", "stations-heat"].forEach(function (id) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
      });
    });
    $("lyGrid").addEventListener("change", function () {
      state.layers.grid = this.checked;
      if (map.getLayer("grid-fill")) {
        map.setLayoutProperty("grid-fill", "visibility", this.checked ? "visible" : "none");
        map.setLayoutProperty("grid-line", "visibility", this.checked ? "visible" : "none");
      }
      if (this.checked) updateGridLayer();
    });
    $("lyCities").addEventListener("change", function () {
      state.layers.cities = this.checked;
      updateCityMarkers();
    });
    document.querySelectorAll("#basemapRow button").forEach(function (b) {
      b.addEventListener("click", function () { switchBasemap(b.dataset.bm); });
    });
    document.querySelectorAll("#countryMetric button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#countryMetric button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        state.countryMetric = b.dataset.m;
        refreshAll();
      });
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    showLoading("Loading overview…");
    Promise.all([
      fetchJSON("data/summary.json"),
      fetchJSON(DATA + "operators.json"),
      fetchJSON(DATA + "overview.geojson"),
      fetchJSON(DATA + "detail/index.json"),
      fetchJSON(DATA + "density_grid.geojson").catch(function () { return null; })
    ]).then(function (res) {
      state.summary = res[0];
      state.operators = res[1];
      state.operators.forEach(function (o, i) { state.opByName[o.name] = i; });
      state.overview = (res[2] && res[2].features) || [];
      state.overviewByCC = {};
      state.overview.forEach(function (feature) {
        var cc = feature.properties.cc;
        (state.overviewByCC[cc] || (state.overviewByCC[cc] = [])).push(feature);
      });
      state.detailIndex = new Set((res[3] && res[3].tiles) || []);
      if (res[4] && res[4].features) {
        state.gridGeoms = {};
        res[4].features.forEach(function (feature) {
          var c = feature.geometry.coordinates[0][0];
          var key = Math.round(c[1] * 2) / 2 + "/" + Math.round(c[0] * 2) / 2;
          state.gridGeoms[key] = feature.geometry.coordinates;
        });
      }

      buildSourceBadges();
      buildCountryList();
      buildCheckList("powerFilter", powerItems(), state.filters.power, scheduleRefresh);
      buildCheckList("typeFilter", typeItems(), state.filters.type, scheduleRefresh);
      buildCheckList("connFilter", connItems(), new Set(), function () {
        var sel = new Set();
        document.querySelectorAll("#connFilter input:checked").forEach(function (i) { sel.add(i.dataset.v); });
        state.filters.conn = sel.size ? sel : null;
        scheduleRefresh();
      });
      buildCheckList("statusFilter", statusItems(), state.filters.status, scheduleRefresh);
      buildCheckList("publicFilter", [
        { v: "all", label: "All (unrestricted)" }, { v: "public", label: "Public access" }, { v: "restricted", label: "Restricted access" }
      ], new Set(["all"]), function () {
        var v = document.querySelector('#publicFilter input:checked');
        state.filters.publicMode = v ? v.dataset.v : "all";
        scheduleRefresh();
      });
      buildOperatorPanel();
      initCharts();
      initMap();
      bindEvents();

      hideLoading();
      setStatus("Loading " + state.selectedCC.size + " countries…");
      return ensureStats(Array.from(state.selectedCC));
    }).then(function () {
      setStatus("Station distribution");
      refreshAll();
      toast("Loaded station data progressively; zoom in for individual points", 3200);
    }).catch(function (e) {
      console.error(e);
      hideLoading();
      toast("Data could not be loaded: " + e.message + " (Open this page through an HTTP server)", 5000);
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
