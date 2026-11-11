---
title: "在瀏覽器裡把 DWG 轉成 KML：從 CAD 圖元到地理座標"
description: "瀏覽器如何把 AutoCAD DWG 圖檔轉成 Google Earth KML——用 WebAssembly 解析圖元、決定哪些幾何能存活、處理座標系統、寫出匯出檔。附從 geoo.app 實作改編、可直接運行的 TypeScript。"
date: "2026-10-23"
tags: ["gis", "tutorial", "webassembly", "cad"]
canonical: "https://geoo.app/blog/dwg-to-kml-in-browser/"
faq:
  - q: "DWG 檔可以完全在瀏覽器裡轉成 KML 嗎？"
    a: "可以。LibreDWG 的 WebAssembly 版本在客戶端解析 DWG，proj4 負責重投影到 WGS84，KML 由 JavaScript 組裝——圖檔完全不必離開設備。"
  - q: "這種做法涵蓋哪些 CAD 圖元？"
    a: "本文示例處理 2D 點、直線，以及不含弧段的輕量聚合線。圓、弧和圖塊參考需要各自的轉接器，刻意不在此範圍。"
  - q: "為什麼我轉出來的圖落在錯誤的位置？"
    a: "幾乎都是因為來源座標系統從未被確認過。CAD 圖裡的 XY 值，在真正的 CRS——或本地格網的配準參數——被應用之前沒有任何地理意義，寫出經緯度之前必須先處理。"
  - q: "本地處理是不是代表完全沒有網路流量？"
    a: "不是。應用的腳本和 WASM 執行環境仍然正常下載；留在本地的是圖檔本身。打開瀏覽器的 Network 面板即可確認檔案內容從未被傳輸。"
---

**TL;DR：** DWG 轉 KML 是四件工作——讀取 CAD 圖元、決定哪些幾何存活、把平面座標變成 WGS84 經緯度、寫出 KML。四件事都能在瀏覽器裡用 WebAssembly 和 proj4 完成，圖檔因此不必離開設備。本文演示可用的 TypeScript，改編自我在 [geoo.app](https://geoo.app) 上的實作。

你手上有一張 DWG 圖，想在地圖上看到它的地塊邊界。要從中產出一份有用的 KML，需要幾個明確的步驟：讀取 CAD 圖元、弄清楚它們的座標是什麼意思、再把幾何寫成地圖能用的格式。

這一切都可以在瀏覽器裡完成。JavaScript 讀取用戶設備上選中的檔案，WebAssembly 解析 DWG，客戶端程式碼處理重投影和匯出。伺服器只提供應用本身和它的執行資產。圖檔本身在整個轉換過程中都可以留在設備上。

這是我在開發 [geoo.app](https://geoo.app) 時採用的做法。下面的示例改編自專案實作，以 TypeScript 撰寫。它們刻意只覆蓋 CAD 幾何的一小部分：2D 點、直線，和不含弧段的輕量聚合線。更複雜的圖元需要各自的轉接器。

![DWG 點、線與邊界轉變為 KML 物件的概念示意](/images/dwg-to-kml/01-cover.jpg)

*圖 1. 幾何轉換的概念示意。不暗示每一項 CAD 資訊都能在匯出後存活。*

## 先決定你要提取什麼

一個 DWG 可以包含模型空間幾何、文字、標註、圖塊參考、版面和其他 CAD 資訊。KML 描述的是地理物件：點、線、面，以及它們的附帶屬性。

對地塊疊圖而言，通常邊界和它的位置優先。保留文字位置、線型和填充是更大的工程。每一項都需要明確的轉換規則；光靠一個幾何解析器，重現不出一張完工的圖紙。

我從 2D 幾何和基本屬性（比如圖層名）開始。POINT 變成點，LINE 變成線段，輕量聚合線變成線串。閉合的聚合線在應用知道它代表面邊界時，可以變成多邊形。

最後這個決定屬於應用層。閉合的線並非在每張圖裡都自動是面。本示例為求簡單，把閉合聚合線當作多邊形處理；產品也可以改為提供「匯出為多邊形」的選項。

圓和弧需要用頂點近似，在形狀精度和輸出體積之間取捨。圖塊參考需要圖塊定義加上插入點、縮放和旋轉變換。只匯出插入點會漏掉圖塊內部的幾何。轉換報告應該把這些省略攤在明處：記錄不支援的圖元類型和跳過的數量。

## 用 WebAssembly 讀取 DWG

文字解析器可以讀某些形式的 DXF。DWG 用的是另一種格式。把它當字串逐行讀，或者改個副檔名，都不叫轉換。

專案用的是 `@mlightcad/libredwg-web`，一個基於 LibreDWG、跑在瀏覽器裡的解析器。[libredwg-web 專案文檔](https://github.com/mlightcad/libredwg-web)描述了這個庫和它的 API。

先裝依賴。以下片段使用該專案 0.7.9 版的解析器介面。升級時請檢查型別定義和執行資產路徑。

```bash
pnpm add @mlightcad/libredwg-web@0.7.9 proj4
pnpm add -D @types/geojson
```

把對應套件的 WASM 執行資產複製到靜態目錄（例如 `public/lib/libredwg/`），檔名保持不變。把瀏覽器可存取的目錄傳給初始化器。部署後檢查 WASM 請求成功，且託管平台沒有回傳一個 HTML fallback 頁面取而代之。

```ts
import { LibreDwg } from '@mlightcad/libredwg-web';

let enginePromise: ReturnType<typeof LibreDwg.create> | undefined;

function getEngine() {
  enginePromise ??= LibreDwg.create('/lib/libredwg').catch(error => {
    enginePromise = undefined;
    throw error;
  });
  return enginePromise;
}

async function readDwg(file: File) {
  const engine = await getEngine();
  const buffer = await file.arrayBuffer();
  const pointer = engine.dwg_read_data(buffer, 0); // 0 means DWG
  if (!pointer) throw new Error('Could not parse the DWG');

  try {
    return engine.convert(pointer);
  } finally {
    engine.dwg_free(pointer);
  }
}
```

此時，選中的檔案已經變成 JavaScript 可存取的 CAD 資料庫。它透過 File API 讀入；這段程式碼不會發出任何包含圖檔內容的網路請求。

我會快取初始化 Promise，讓後續檔案重用同一個引擎。原生解析器的資料在轉換成 JavaScript 物件後即被釋放。處理大圖時，輸入緩衝、解析器資料和匯出物件可能同時佔用記憶體。用戶連續轉換多個檔案時，釋放原生分配就很重要。

在 React 或 Next.js 裡，這段程式碼跑在客戶端。解析器可以在用戶選中 DWG 時動態載入，而不是每次造訪頁面都載入。另外在共用的引擎上序列化任務，或在轉換進行中停用提交按鈕，避免重複點擊啟動互相重疊的工作。

![瀏覽器本地流水線：DWG 輸入，經 WASM 與 WGS84 轉換，到 KML 下載](/images/dwg-to-kml/02-pipeline.jpg)

*圖 2. 圖檔在瀏覽器中處理。頁面與 WASM 執行環境仍可能需要經網路下載。*

## 匯出前先規整幾何

解析器回傳 CAD 圖元。我把這些先轉成 GeoJSON 形狀的內部表示，再處理座標和匯出。這樣預覽程式碼和其他匯出器拿到的是同一套幾何，而不是把 KML 格式化混進每個圖元轉接器。

這裡有一個重要的限定：在來源座標被轉換到 WGS84 之前，這只是一個借用 GeoJSON 形狀的內部資料結構。不要把投影後的 XY 座標當成符合標準的 GeoJSON 檔案發布出去。

下面的轉接器處理三種圖元，並在屬性裡保留圖層名。它跳過帶非零 bulge 的輕量聚合線——bulge 描述的是弧段；直接把端點連起來會改變形狀。

```ts
import type {
  DwgEntity, DwgPointEntity, DwgLineEntity, DwgLWPolylineEntity,
} from '@mlightcad/libredwg-web';
import type { Feature, Point, LineString, Polygon } from 'geojson';

type Shape = Point | LineString | Polygon;
type Item = Feature<Shape, { layer: string }>;
const xy = (p: { x: number; y: number }) => [p.x, p.y];

function toFeature(entity: DwgEntity): Item | null {
  if (entity.isVisible === false) return null;
  let geometry: Shape;

  if (entity.type === 'POINT') {
    const point = entity as DwgPointEntity;
    geometry = { type: 'Point', coordinates: xy(point.position) };
  } else if (entity.type === 'LINE') {
    const line = entity as DwgLineEntity;
    geometry = {
      type: 'LineString',
      coordinates: [xy(line.startPoint), xy(line.endPoint)],
    };
  } else if (entity.type === 'LWPOLYLINE') {
    const line = entity as DwgLWPolylineEntity;
    if (line.vertices.some(v => v.bulge)) return null;
    const points = line.vertices.map(xy);
    const closed = (line.flag & 1) !== 0;
    if (points.length < (closed ? 3 : 2)) return null;

    if (closed) {
      const first = points[0];
      const last = points[points.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        points.push([...first]);
      }
      geometry = { type: 'Polygon', coordinates: [points] };
    } else {
      geometry = { type: 'LineString', coordinates: points };
    }
  } else {
    return null;
  }

  return {
    type: 'Feature',
    properties: { layer: entity.layer || '0' },
    geometry,
  };
}
```

示例假設的是普通 2D 平面圖元，不處理帶非標準拉伸方向的物件座標系統。生產級轉接器在把圖元放進統一座標空間之前，需要先處理 OCS 到 WCS 的轉換。模型空間與圖紙空間的過濾也需要明確處理，免得圖框和版面裝飾變成地圖要素。

當轉接器回傳 null 時，呼叫方應該記錄這個圖元為什麼被跳過。一份有效的圖檔產出零個支援要素，和一個損壞或不可讀的檔案，應該給出不同的訊息。「未找到受支援的幾何」至少給了用戶一個有用的下一步。

## 座標決定圖落在哪裡

讀到 XY 值，並不告訴我們它們在地球上屬於哪裡。一張圖可能用公尺、公厘，或專案專屬的本地格網。每個頂點都可以被正確提取，卻因為來源座標被錯誤解讀而落在錯誤的位置。

KML 座標三元組的順序是經度、緯度、可選高度。[KML 參考文檔](https://developers.google.com/kml/documentation/kmlreference)記載了順序和高度模式。這個 2D 示例把水平座標轉到 WGS84，輸出採用貼地模式，經度在前、緯度在後。

來源座標參考系統已知時，Proj4js 可以執行轉換。它的 source-to-target API 記載在 [Proj4js repo](https://github.com/proj4js/proj4js)。一張確認使用 Web Mercator 的圖，來源可以是 EPSG:3857。這只是一個例子，不是 DWG 檔的預設值。請使用真正屬於這張圖的定義。

```ts
import proj4 from 'proj4';

function projectPosition(position: number[], sourceCrs: string) {
  const [x, y] = position;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('Source coordinates contain invalid values');
  }
  const [lon, lat] = proj4(sourceCrs, 'EPSG:4326', [x, y]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat) ||
      Math.abs(lon) > 180 || Math.abs(lat) > 90) {
    throw new Error('Coordinates are out of range; check the source CRS');
  }
  return [lon, lat];
}

function projectFeature(feature: Item, sourceCrs: string): Item {
  const g = feature.geometry;
  const convert = (p: number[]) => projectPosition(p, sourceCrs);
  let geometry: Shape;
  if (g.type === 'Point') {
    geometry = { type: 'Point', coordinates: convert(g.coordinates) };
  } else if (g.type === 'LineString') {
    geometry = { type: 'LineString', coordinates: g.coordinates.map(convert) };
  } else {
    geometry = {
      type: 'Polygon',
      coordinates: g.coordinates.map(ring => ring.map(convert)),
    };
  }
  return { ...feature, geometry };
}
```

範圍檢查能抓住明顯的失敗，但無法證明位置正確。座標可以在合法的經緯度範圍內，卻離目標工地很遠。請核對一個控制點、一個已知路口，或其他可靠參照位置。

本地工程格網通常需要控制點和配準參數，才能和地理座標建立關係。去要這些資訊，而不是隨手指派一個 EPSG 代碼。帶分帶號、中央子午線不同、或座標帶前綴的投影資料，同樣需要確認精確定義。

本示例丟棄了 Z 值。要做 3D 匯出，需要對原始垂直單位、垂直基準和 KML 高度模式做出決定。把第三個 CAD 座標直接複製進絕對高度欄位，可能讓物件懸在預期位置的上方或下方。

![已知來源 CRS 經 proj4 轉換為 WGS84 經緯度](/images/dwg-to-kml/03-coordinates.jpg)

*圖 3. 先確定來源 CRS。本地格網需要控制點一類的配準資訊。*

## 寫出 KML 並下載

幾何和座標就緒後，有幾個實用的匯出選項。專案可以用瀏覽器版的 GDAL 來寫 KML，與既有的匯出流水線共用程式碼。對本文的點、線、面子集，一個小型序列化器也能讓輸出易於檢查。

下面的函式接受前文定義的 Item 型別，並假設重投影已經完成。它把圖層名存進 ExtendedData，用圖層名加索引作為要素名稱。XML 字元必須轉義，這樣含 & 符號的圖層名才不會破壞文件。

```ts
function xml(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toKml(items: Item[]) {
  const coords = (points: number[][]) =>
    points.map(([lon, lat]) => `${lon},${lat},0`).join(' ');
  const ring = (points: number[][]) =>
    `<LinearRing><coordinates>${coords(points)}</coordinates></LinearRing>`;

  const placemarks = items.map((item, index) => {
    const g = item.geometry;
    let shape: string;
    if (g.type === 'Point') {
      shape = `<Point><coordinates>${coords([g.coordinates])}</coordinates></Point>`;
    } else if (g.type === 'LineString') {
      shape = `<LineString><coordinates>${coords(g.coordinates)}</coordinates></LineString>`;
    } else {
      const [outer, ...holes] = g.coordinates;
      shape = `<Polygon><outerBoundaryIs>${ring(outer)}</outerBoundaryIs>` +
        holes.map(h => `<innerBoundaryIs>${ring(h)}</innerBoundaryIs>`).join('') +
        '</Polygon>';
    }
    const layer = xml(item.properties.layer);
    return `<Placemark><name>${layer}-${index + 1}</name>` +
      `<ExtendedData><Data name="layer"><value>${layer}</value></Data></ExtendedData>` +
      shape + '</Placemark>';
  });

  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>' +
    placemarks.join('') + '</Document></kml>';
}

function downloadKml(content: string) {
  const blob = new Blob([content], {
    type: 'application/vnd.google-earth.kml+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'converted.kml';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

把這些片段放進同一個客戶端模組，接到檔案選擇事件上。呼叫方必須先取得經確認的來源 CRS，並在轉換進行中阻止再次提交。

```ts
async function convertAndDownload(file: File, sourceCrs: string) {
  if (!sourceCrs) throw new Error('Confirm the source CRS first');
  const database = await readDwg(file);
  const features = database.entities
    .map(toFeature)
    .filter((feature): feature is Item => feature !== null);
  if (!features.length) throw new Error('No geometry supported by this example was found');
  downloadKml(toKml(features.map(f => projectFeature(f, sourceCrs))));
}
```

這個版本匯出幾何和一個基本屬性。它不重現 CAD 樣式，也不為 CAD 圖層自動建立 KML 資料夾。要支援圖層開關，請按圖層給要素分組，為每組寫一個 Folder。KML 的顏色也有自己的編碼；CSS 顏色字串不能原樣複製進 KML 樣式欄位。

## 用一張你完全了解的圖來驗收

從一個內容已知的小檔案開始。為了這個專案，我準備了一張虛構的 DWG：一個點、一條線、一個閉合面，各在自己的圖層上。座標在製作測試檔時就被明確定義為 WGS84。它不含任何真實專案資料。

瀏覽器轉換產出三個要素、三個 KML Placemark。幾何類型和圖層名與測試檔一致。我也把匯出的 KML 打開在瀏覽器檢視器裡，檢查下圖的點、線、面顯示。這不能取代在 Google Earth 或收件方實際使用的應用裡做檢查。

![geoo.app 瀏覽器檢視器中顯示的虛構 KML 測試檔](/images/dwg-to-kml/04-sample-viewer.png)

*圖 4. 一個真實的瀏覽器 KML 檢視器，顯示虛構的 WGS84 測試檔。這不是 Google Earth 的截圖。*

一個小測試檔讓缺失的物件和屬性更容易被發現。它通過之後，再分別加入弧、文字和圖塊參考。新案例失敗時，要排查的程式碼範圍小得多。

用真實圖紙時，先看整體範圍，再抽查幾個已知位置。座標量級異常，提示你去檢查單位、軸序和來源 CRS。曲線邊界上出現筆直的捷徑，提示有未處理的聚合線弧段。符號缺失可能來自沒有被展開的圖塊參考。

大檔案還需要流暢度檢查。WebAssembly 不會自動跑在背景執行緒上。同步解析可以像主執行緒上的其他工作一樣凍結 UI。必要時，可以用 Web Worker 承載解析和座標處理。進度訊息應該對應真實階段：讀取、解析、重投影、匯出。

記憶體用量取決於圖元數、頂點數，以及多少中間副本仍然存活。小檔案的成功，幾乎說明不了某台設備能處理的最大圖檔。用有代表性的檔案測試，並把記憶體不足和解析錯誤寫成用戶能理解的訊息。

## 如果只是要轉檔，用瀏覽器工具就好

偶爾轉一個檔案，不需要自己造一個應用。一個瀏覽器工具就能完成，只要它支援 DWG 輸入、讓你確認來源 CRS、並且在你期望的地方處理檔案。

檢查選中檔案之後發生什麼。有些網站把圖紙上傳到伺服器上轉換；另一些把解析器載入瀏覽器、在本地產生結果。對包含工地邊界或設施位置的圖紙來說，本地處理省掉了把圖紙交給第三方轉換伺服器的這一步。

本地處理不代表頁面沒有網路流量。腳本、WASM 二進位和其他應用資產仍可能需要下載，網站也可能使用分析工具。把這些請求和圖紙本身的傳輸區分開。開發者可以對照實作檢查 Network 面板，確認轉換過程中檔案內容沒有被送出。離線的要求更嚴格：執行依賴也必須在本地可用，而且完整流程要在斷網下測試。

我開發的 [geoo.app](https://geoo.app) 內含一個[DWG 轉 KML 轉換器](https://geoo.app/tools/converter)，使用客戶端解析與轉換。選圖紙、確認來源 CRS，然後下載 KML，在相容的地圖應用裡檢查。對偏好瀏覽器工作流程、又不想把圖紙上傳到轉換伺服器的人，它是一個選項。

![真實的 geoo.app DWG 轉 KML 介面，含來源 CRS 設定](/images/dwg-to-kml/05-converter.png)

*圖 5. 實際的轉換器介面。這個測試檔的座標已知為 WGS84，所以來源與輸出 CRS 都是 WGS84。*

檔案仍然需要已知的座標系統。不清楚時去問提供圖紙的人，並為本地格網取得配準資訊。在下載的結果裡先核對一個已知位置，再交給別人。

![虛構 DWG 測試檔的成功轉換與 KML 下載控制項](/images/dwg-to-kml/06-conversion-result.png)

*圖 6. 對含一個點、一條線和一個閉合面的虛構測試檔的實際轉換。*

第一次嘗試，請用一張含一個已知點和一小段線的圖。它們在地圖上的位置正確之後，再前進到邊界幾何和圖紙的其餘部分。

## 延伸閱讀

- 不想寫程式？[DWG 轉 KMZ 教學——免費、直接在瀏覽器裡完成](/zh-TW/blog/how-to-convert-dwg-to-kmz/)從用戶視角走一遍同一個轉換，無需 TypeScript。
- 對這個工具箱還能做什麼好奇？見[geoo.app 介紹](/zh-TW/blog/introducing-geoo-app/)。
