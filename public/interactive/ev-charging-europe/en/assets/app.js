/* ============================================================
 * European EV charging station explorer · app.js
 * Data: data/summary.json + data/geojson/{CC}.geojson (MapLibre GL + ECharts)
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
  var CHART_COLORS = ["#69d9b8", "#f59e0b", "#10b981", "#ef4444", "#a99acb", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#14b8a6", "#64748b", "#a855f7"];
  var CARTO_STYLES = {
    positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  };
  var DEFAULT_COUNTRIES = ["DE", "FR", "GB", "ES", "IT", "NL", "SE", "NO"];

  /* ---------------- Status ---------------- */
  var state = {
    summary: null,
    operators: [],          // [{name, stations, points, countries}]
    opByName: {},
    cache: {},              // cc -> Feature[]
    features: [],           // 当前选中Country的全部 feature
    selectedCC: new Set(DEFAULT_COUNTRIES),
    filters: {
      power: new Set([0, 1, 2, 3, -1]),
      type: new Set([0, 1, 2]),
      conn: null,           // null=不限
      status: new Set([0, 1, 2, 3, 4]),
      publicMode: "all",    // all | public | restricted
      ops: null             // null=不限, Set<name>
    },
    layers: { heatmap: false, grid: false, cities: true },
    basemap: "dark",
    countryMetric: "stations",
    charts: {},
    gridGeoms: null,        // cellKey -> polygon coords
    cityMarkers: []
  };

  var map = null;

  /* ---------------- 工具 ---------------- */
  function $(id) { return document.getElementById(id); }
  function fmt(n) { return n == null ? "—" : n.toLocaleString("zh-CN"); }
  function pct(x) { return x == null ? "—" : (x * 100).toFixed(1) + "%"; }

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

  /* ---------------- 筛选表达式 ---------------- */
  function buildMapFilter() {
    var f = state.filters;
    var conds = [];
    if (state.selectedCC.size) {
      conds.push(["in", ["get", "cc"], ["literal", Array.from(state.selectedCC)]]);
    }
    conds.push(["in", ["get", "c"], ["literal", Array.from(f.power)]]);
    conds.push(["in", ["get", "t"], ["literal", Array.from(f.type)]]);
    conds.push(["in", ["get", "s"], ["literal", Array.from(f.status)]]);
    if (f.publicMode === "public") {
      conds.push(["==", ["coalesce", ["get", "pb"], 2], 1]);
    } else if (f.publicMode === "restricted") {
      conds.push(["==", ["coalesce", ["get", "pb"], 2], 0]);
    }
    if (f.conn && f.conn.size) {
      var any = ["any"].concat(Array.from(f.conn).map(function (c) {
        return ["in", c, ["coalesce", ["get", "cn"], ["literal", []]]];
      }));
      conds.push(any);
    }
    if (f.ops && f.ops.size) {
      var idxs = [];
      f.ops.forEach(function (name) { if (state.opByName[name] != null) idxs.push(state.opByName[name]); });
      if (idxs.length) conds.push(["in", ["get", "o"], ["literal", idxs]]);
    }
    return conds.length ? ["all"].concat(conds) : null;
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
    if (f.ops && f.ops.size && (p.o < 0 || !f.ops.has(state.operators[p.o] ? state.operators[p.o].name : ""))) return false;
    return true;
  }

  /* ---------------- DataLoad ---------------- */
  function loadCountry(cc) {
    if (state.cache[cc]) return Promise.resolve(state.cache[cc]);
    return fetchJSON(DATA + "geojson/" + cc + ".geojson").then(function (fc) {
      var feats = fc.features || [];
      feats.forEach(function (ft) { ft.properties.cc = cc; });
      state.cache[cc] = feats;
      return feats;
    });
  }

  function rebuildFeatures() {
    var all = [];
    state.selectedCC.forEach(function (cc) {
      if (state.cache[cc]) all = all.concat(state.cache[cc]);
    });
    state.features = all;
    if (map && map.getSource("stations")) {
      map.getSource("stations").setData({
        type: "FeatureCollection",
        features: all
      });
    }
  }

  function ensureCountries(ccs, onDone) {
    var todo = ccs.filter(function (cc) { return !state.cache[cc]; });
    if (!todo.length) { rebuildFeatures(); applyMapFilter(); refreshAll(); onDone && onDone(); return Promise.resolve(); }
    showLoading("Loading " + todo.map(function (c) { return c; }).join("、") + " Data…");
    var jobs = todo.map(function (cc) {
      return loadCountry(cc).catch(function (e) {
        console.error(e); toast("Load " + cc + " failed"); return [];
      });
    });
    return Promise.all(jobs).then(function () {
      rebuildFeatures();
      applyMapFilter();
      refreshAll();
      hideLoading();
      onDone && onDone();
    });
  }

  /* ---------------- 聚合统计 ---------------- */
  function aggregate() {
    var agg = {
      stations: 0, points: 0, ops: {}, ccs: {}, power: {}, type: {}, status: {},
      conn: {}, year: {}, cities: {}
    };
    var feats = state.features;
    for (var i = 0; i < feats.length; i++) {
      var p = feats[i].properties;
      if (!passFeature(p)) continue;
      agg.stations++;
      agg.points += p.n || 1;
      if (p.o >= 0 && state.operators[p.o]) {
        var opn = state.operators[p.o].name;
        agg.ops[opn] = (agg.ops[opn] || 0) + 1;
      }
      agg.ccs[p.cc] = (agg.ccs[p.cc] || 0) + 1;
      agg.power[p.c] = (agg.power[p.c] || 0) + 1;
      agg.type[p.t] = (agg.type[p.t] || 0) + 1;
      agg.status[p.s] = (agg.status[p.s] || 0) + 1;
      if (p.cn) p.cn.forEach(function (c) { agg.conn[c] = (agg.conn[c] || 0) + 1; });
      if (p.yr) agg.year[p.yr] = (agg.year[p.yr] || 0) + 1;
      if (p.ct) {
        var ck = p.cc + "|" + p.ct;
        if (!agg.cities[ck]) agg.cities[ck] = { n: 0, lat: 0, lon: 0, cc: p.cc, city: p.ct };
        var c = agg.cities[ck];
        c.n++; c.lat += feats[i].geometry.coordinates[1]; c.lon += feats[i].geometry.coordinates[0];
      }
    }
    Object.keys(agg.cities).forEach(function (k) {
      var c = agg.cities[k];
      c.lat /= c.n; c.lon /= c.n;
    });
    return agg;
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
      // Basemap tile request failed（离线）时不阻塞Data图层
      if (e && e.error && /Failed to fetch|NetworkError|Load failed/i.test(String(e.error.message || ""))) {
        if (state.basemap !== "local") {
          toast("Online basemap unavailable，Switched to the offline outline basemap");
          switchBasemap("local");
        }
      }
    });

    map.on("load", function () {
      // Data source（聚类）
      map.addSource("stations", {
        type: "geojson",
        data: { type: "FeatureCollection", features: state.features },
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 13,
        tolerance: 1.2
      });

      // 密度网格
      fetchJSON(DATA + "density_grid.geojson").then(function (fc) {
        state.gridGeoms = {};
        (fc.features || []).forEach(function (ft) {
          var c = ft.geometry.coordinates[0][0];
          var key = Math.round(c[1] * 2) / 2 + "/" + Math.round(c[0] * 2) / 2;
          state.gridGeoms[key] = ft.geometry.coordinates;
        });
        map.addSource("grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({
          id: "grid-fill", type: "fill", source: "grid",
          layout: { visibility: state.layers.grid ? "visible" : "none" },
          paint: {
            "fill-color": ["interpolate", ["linear"], ["get", "n"],
              1, "#e0e7ff", 10, "#a5b4fc", 50, "#818cf8", 200, "#6366f1", 500, "#4338ca", 1200, "#312e81"],
            "fill-opacity": ["interpolate", ["linear"], ["get", "n"],
              1, 0.10, 50, 0.18, 200, 0.26, 500, 0.32, 1200, 0.38]
          }
        }, map.getLayer("waterway-label") ? "waterway-label" : undefined);
        map.addLayer({
          id: "grid-line", type: "line", source: "grid",
          layout: { visibility: state.layers.grid ? "visible" : "none" },
          paint: { "line-color": "#6366f1", "line-width": 0.4, "line-opacity": 0.5 }
        }, map.getLayer("waterway-label") ? "waterway-label" : undefined);
      }).catch(function () { /* 离线时静默 */ });

      // Heatmap
      map.addLayer({
        id: "stations-heat", type: "heatmap", source: "stations",
        layout: { visibility: state.layers.heatmap ? "visible" : "none" },
        maxzoom: 15,
        paint: {
          "heatmap-weight": ["coalesce", ["get", "point_count"], 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 1.2, 10, 2.4],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(59,130,246,0)", 0.15, "#3b82f6", 0.35, "#22d3ee",
            0.55, "#facc15", 0.75, "#f97316", 1, "#dc2626"],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 14, 8, 22, 13, 30],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.85, 15, 0]
        }
      });

      // 聚类圆
      map.addLayer({
        id: "clusters", type: "circle", source: "stations",
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
      });

      // 聚类计数
      map.addLayer({
        id: "cluster-count", type: "symbol", source: "stations",
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
      });

      // 单点
      map.addLayer({
        id: "stations-point", type: "circle", source: "stations",
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
      });

      applyMapFilter();
      refreshAll();
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
        '<div class="popup-src">Data sources：' + esc(SOURCE_LABELS[countrySource(p.cc)] || p.cc) + " · OCM/Official open data</div>";
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

    // 光标样式
    ["clusters", "stations-point"].forEach(function (lyr) {
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
    if (!map || !map.getLayer("clusters")) return;
    map.getSource("stations").setData({ type: "FeatureCollection", features: state.features.filter(function (ft) { return passFeature(ft.properties); }) });
    map.setFilter("clusters", ["has", "point_count"]);
    map.setFilter("cluster-count", ["has", "point_count"]);
    map.setFilter("stations-point", ["!", ["has", "point_count"]]);
    map.setFilter("stations-heat", null);
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
    // setStyle 会Clear自定义图层，需在样式就绪后重建
    map.once("styledata", function () { setTimeout(function () { addDataLayers(false); }, 60); });
  }

  function addDataLayers(retry) {
    if (map.getLayer("stations-heat")) return;
    try {
      if (!map.getSource("stations")) {
        map.addSource("stations", {
          type: "geojson", data: { type: "FeatureCollection", features: state.features },
          cluster: true, clusterRadius: 45, clusterMaxZoom: 13, tolerance: 1.2
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
    map.addLayer({
      id: "stations-heat", type: "heatmap", source: "stations",
      layout: { visibility: state.layers.heatmap ? "visible" : "none" },
      maxzoom: 15,
      paint: {
        "heatmap-weight": ["coalesce", ["get", "point_count"], 1],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 1.2, 10, 2.4],
        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(59,130,246,0)", 0.15, "#3b82f6", 0.35, "#22d3ee",
          0.55, "#facc15", 0.75, "#f97316", 1, "#dc2626"],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 14, 8, 22, 13, 30],
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.85, 15, 0]
      }
    });
    map.addLayer({
      id: "clusters", type: "circle", source: "stations", filter: ["has", "point_count"],
      paint: {
        "circle-color": ["step", ["get", "point_count"], "#90e4ca", 10, "#54caaa", 50, "#24a78a", 200, "#147d6b"],
        "circle-radius": ["step", ["get", "point_count"], 12, 10, 16, 50, 21, 200, 28],
        "circle-stroke-width": 2, "circle-stroke-color": "rgba(139,237,210,0.45)", "circle-opacity": 0.82
      }
    });
    map.addLayer({
      id: "cluster-count", type: "symbol", source: "stations", filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Regular"], "text-size": 12 },
      paint: { "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.25)", "text-halo-width": 0.6 }
    });
    map.addLayer({
      id: "stations-point", type: "circle", source: "stations", filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["case",
          ["==", ["get", "c"], 0], POWER_COLORS[0],
          ["==", ["get", "c"], 1], POWER_COLORS[1],
          ["==", ["get", "c"], 2], POWER_COLORS[2],
          ["==", ["get", "c"], 3], POWER_COLORS[3],
          POWER_COLORS[4]],
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 2.6, 12, 4.2, 15, 6.5],
        "circle-stroke-width": 0.8, "circle-stroke-color": "rgba(255,255,255,0.75)"
      }
    });
    applyMapFilter();
    } catch (err) {
      console.warn("addDataLayers retry:", err);
      if (!retry) setTimeout(function () { addDataLayers(true); }, 500);
    }
  }

  function updateGridLayer() {
    if (!map.getSource("grid") || !state.layers.grid) return;
    var cells = {};
    for (var i = 0; i < state.features.length; i++) {
      var p = state.features[i].properties;
      if (!passFeature(p)) continue;
      var g = state.features[i].geometry.coordinates;
      var key = Math.floor(g[1] * 2) / 2 + "/" + Math.floor(g[0] * 2) / 2;
      if (!cells[key]) cells[key] = { n: 0, cc: p.cc };
      cells[key].n++;
    }
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
    if (!state.layers.cities) return;
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
    var base = {
      textStyle: { fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' },
      animationDuration: 400
    };
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
    var avgP = 0, np = 0;
    state.features.forEach(function (ft) {
      var p = ft.properties;
      if (!passFeature(p) || p.p < 0) return;
      avgP += p.p * (p.n || 1); np += (p.n || 1);
    });
    var cards = [
      { v: fmt(agg.stations), k: "Stations (filtered)" },
      { v: fmt(agg.points), k: "Charging points" },
      { v: fmt(Object.keys(agg.ccs).length), k: "Countries / territories" },
      { v: fmt(opCount), k: "Operator names" },
      { v: pct(total ? dc / total : null), k: "DC share" },
      { v: pct(agg.stations ? fast / agg.stations : null), k: ">50kW class share" },
      { v: np ? (avgP / np).toFixed(1) + " kW" : "—", k: "Mean power (point-weighted)" },
      { v: pct(agg.stations ? knownPower / agg.stations : null), k: "Known power" },
      { v: fmt(state.cache && Object.keys(state.cache).length), k: "Loaded countries" }
    ];
    $("statCards").innerHTML = cards.map(function (c) {
      return '<div class="stat-card"><div class="v">' + c.v + '</div><div class="k">' + c.k + "</div></div>";
    }).join("");
  }

  function renderCharts(agg) {
    // 1. Country排行
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

    // 2. Power class
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

    // 3. City
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

    // 4. Operator
    var ops = Object.keys(agg.ops).map(function (k) { return { name: k, v: agg.ops[k] }; });
    ops.sort(function (a, b) { return b.v - a.v; });
    ops = ops.slice(0, 15);
    state.charts.operators.setOption(barOption(
      ops.map(function (o) { return o.name.length > 22 ? o.name.slice(0, 21) + "…" : o.name; }),
      ops.map(function (o) { return o.v; }),
      "#58bda3", true, " stations"
    ), true);

    // 5. Connectors
    var conns = Object.keys(agg.conn).map(function (k) { return { name: k, v: agg.conn[k] }; });
    conns.sort(function (a, b) { return b.v - a.v; });
    conns = conns.slice(0, 10);
    state.charts.connectors.setOption(barOption(
      conns.map(function (c) { return c.name; }),
      conns.map(function (c) { return c.v; }),
      "#a99acb", false, " stations"
    ), true);

    // 6. Commissioned
    var years = Object.keys(agg.year).map(Number).sort(function (a, b) { return a - b; });
    var yMin = years.length ? Math.min(2010, years[0]) : 2010;
    var yMax = years.length ? Math.max(2026, years[years.length - 1]) : 2026;
    var ycats = [], yvals = [];
    for (var y = yMin; y <= yMax; y++) { ycats.push(y); yvals.push(agg.year[y] || 0); }
    state.charts.timeline.setOption(barOption(ycats, yvals, "#f59e0b", false, " stations"), true);
  }

  function refreshAll() {
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
      return '<div class="note-src"><b>' + esc(s.name) + "</b>（" + esc(s.license) +
        "; snapshot " + esc(s.snapshot) + "; coverage " + esc(s.covers) + '）<br>' +
        '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.url) + "</a></div>";
    }).join("") + '<div class="note-src">Population / land area：World Bank (2023)。Basemap：© OpenStreetMap contributors © CARTO。' +
      "Counts refer to station records; a station may contain multiple charging points.</div>";
  }

  function buildCountryList() {
    var box = $("ccList");
    var kw = $("ccSearch").value.trim().toLowerCase();
    var html = "";
    state.summary.countries.forEach(function (c) {
      if (kw && c.name.indexOf(kw) < 0 && c.cc.toLowerCase().indexOf(kw) < 0 &&
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
          ensureCountries([cc]);
        } else {
          state.selectedCC.delete(cc);
          rebuildFeatures();
        }
        scheduleRefresh();
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
    ensureCountries(Array.from(state.selectedCC));
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

  /* ---------------- 启动 ---------------- */
  function boot() {
    showLoading("Loading summary data…");
    Promise.all([
      fetchJSON("data/summary.json"),
      fetchJSON(DATA + "operators.json")
    ]).then(function (res) {
      state.summary = res[0];
      state.operators = res[1];
      state.operators.forEach(function (o, i) { state.opByName[o.name] = i; });
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
      // Load默认Country
      var ccs = Array.from(state.selectedCC);
      showLoading("Loading " + ccs.join("、") + " station data…");
      return ensureCountries(ccs);
    }).then(function () {
      hideLoading();
      toast("Loaded " + fmt(state.features.length) + " stations", 3000);
      refreshAll();
    }).catch(function (e) {
      console.error(e);
      hideLoading();
      toast("Data could not be loaded：" + e.message + "（Open this page through an HTTP server）", 5000);
    });

    // ---- 事件绑定 ----
    $("btnReset").addEventListener("click", resetFilters);
    $("ccSearch").addEventListener("input", buildCountryList);
    $("btnCCAll").addEventListener("click", function () {
      var ccs = state.summary.countries.map(function (c) { return c.cc; });
      state.selectedCC = new Set(ccs);
      buildCountryList();
      ensureCountries(ccs);
      scheduleRefresh();
    });
    $("btnCCNone").addEventListener("click", function () {
      state.selectedCC = new Set();
      buildCountryList();
      rebuildFeatures();
      scheduleRefresh();
    });
    $("lyHeatmap").addEventListener("change", function () {
      state.layers.heatmap = this.checked;
      if (map.getLayer("stations-heat")) map.setLayoutProperty("stations-heat", "visibility", this.checked ? "visible" : "none");
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

  document.addEventListener("DOMContentLoaded", boot);
})();
