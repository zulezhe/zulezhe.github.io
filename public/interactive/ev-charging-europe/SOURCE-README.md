# 欧洲电动汽车充电站分布可视化（EV Charging Europe）

基于 **公开开放数据** + **MapLibre GL JS** 的欧洲充电桩交互式可视化分析页面。

![页面预览](screenshot_final.png)

- 覆盖 **48 个欧洲国家/地区**，共 **275,402 个充电站**（753,603 个充电点）
- 支持按 **国家、充电功率类型、交直流、接口类型、运营状态、访问权限、运营商** 多维筛选
- 提供 **地理分布（聚类/散点/热力图）**、**0.5° 覆盖密度网格**、**主要聚集城市标注**
- 图表分析：国家排行（站点数 / 每百万人 / 每千 km²）、功率类型分布、聚集城市 Top15、运营商 Top15、接口分布、投运年份趋势

## 快速开始

需要通过本地 HTTP 服务访问（浏览器不允许 `file://` 读取数据文件）：

```bash
cd ev-charging-europe
./start.sh            # 默认 http://localhost:8080
# 或
python3 -m http.server 8080
# 或
npx serve .
```

然后浏览器打开 <http://localhost:8080>。

> 在线底图（CARTO）需要网络；无网络时页面会自动切换到内置「离线简版」底图（含欧洲国界轮廓），数据图层与统计不受影响。

## 数据来源（均为公开开放数据）

| 来源 | 覆盖 | 许可 | 快照 |
|---|---|---|---|
| 德国 Bundesnetzagentur《Ladesäulenregister》充电桩注册表（经 [ratopi/ladesaeule](https://ratopi.github.io/ladesaeule/) 周更 JSON 镜像获取） | 德国 116,443 站 | CC BY 4.0 | 2026-09 |
| 法国 IRVE 全国汇总库 [bornes-irve](https://odre.opendatasoft.com/explore/datasets/bornes-irve/)（Etalab/ODRE） | 法国 59,031 站 | Licence Ouverte 2.0 / ODbL | 2026-10 |
| [Open Charge Map](https://github.com/openchargemap/ocm-export) 官方导出（ocm-export） | 其余 46 个国家/地区 99,928 站 | CC BY 4.0（混合许可） | 2026-04 |
| 人口/国土面积参考：[World Bank](https://data.worldbank.org/) SP.POP.TOTL / AG.LND.TOTL.K2 | 40 国 | CC BY 4.0 | 2023 |
| 国界轮廓（离线底图回退）：Natural Earth 110m | 欧洲 | 公有领域 | — |

重新抓取原始数据并重建数据集：

```bash
# 1. 德国（BNetzA 官方注册表，gzip JSON）
curl -L -o data/raw/germany_bnetza_ladesaeulen.json.gz \
  https://ratopi.github.io/ladesaeule/ladesaeulen.json.gz

# 2. 法国（IRVE 全国汇总 CSV）
curl -L -o data/raw/france_irve_bornes.csv \
  "https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/exports/csv?use_labels=true"

# 3. Open Charge Map（其余欧洲国家，git 稀疏检出）
git clone --filter=blob:none --no-checkout --depth 1 --sparse \
  https://github.com/openchargemap/ocm-export.git data/raw/ocm-export
cd data/raw/ocm-export && git sparse-checkout set data/AT data/BE ... data/DE data/referencedata.json && git checkout

# 4. 人口/面积（World Bank）
curl -s "https://api.worldbank.org/v2/country/DEU;FRA;...;/indicator/SP.POP.TOTL?format=json&date=2023" ...

# 5. 执行 ETL
python3 scripts/etl.py
```

## 目录结构

```
ev-charging-europe/
├── index.html                  # 可视化页面（入口）
├── start.sh                    # 本地启动脚本
├── assets/
│   ├── app.js                  # 应用逻辑（地图/筛选/图表）
│   ├── style.css               # 样式（深色充电网络主题）
│   └── vendor/                 # 本地依赖（离线可用）
│       ├── maplibre-gl.js / .css   # MapLibre GL JS 4.7.1 (BSD-3)
│       └── echarts.min.js          # Apache ECharts 5.5.1 (Apache-2.0)
├── scripts/
│   └── etl.py                  # 数据 ETL 管线（可复现全流程）
└── data/
    ├── stations.csv            # 全量统一数据集（275,402 行，UTF-8-SIG，Excel 可直接打开）
    ├── geojson/{CC}.geojson    # 按国家拆分的地图就绪 GeoJSON（48 个）
    ├── summary.json            # 全局统计汇总（驱动统计卡片与图表）
    ├── operators.json          # 全球运营商列表（12,413 家，GeoJSON 中以索引引用）
    ├── density_grid.geojson    # 0.5° 网格覆盖密度（2,952 个非空格子）
    ├── europe_boundary.geojson # 欧洲国界轮廓（离线底图回退）
    └── raw/                    # 原始数据归档（德国 BNetzA gz + 参考数据）
```

## 数据字典（stations.csv）

| 字段 | 说明 |
|---|---|
| `id` | 唯一 ID（`DE-BNetzA-*` / `FR-IRVE-*` / `OCM-*`） |
| `source` | 数据来源：`BNetzA` / `IRVE` / `OCM` |
| `country` | ISO 3166-1 alpha-2 国家码 |
| `name` / `operator` / `city` / `region` / `postcode` / `address` | 名称 / 运营商 / 城市 / 省州 / 邮编 / 地址 |
| `lat` / `lon` | WGS84 十进制坐标 |
| `power_kw` | 站点额定最大功率（kW），异常值已清洗 |
| `charge_type` | `AC` / `DC` |
| `power_class` / `power_class_label` | 功率分档 0–3：≤11 kW 慢充 / 11–22 kW 交流 / 22–50 kW 交流快充 / ≥50 kW 直流快充 |
| `connectors` | 接口类型（Type 2 / CCS / CHAdeMO / Schuko / Tesla / Type 1 / Type 3 / MCS / CEE 等，`;` 分隔） |
| `num_points` | 站点包含的充电点数量 |
| `status` | 运营中 / 维护中 / 规划中 / 停止运营 / 状态未知 |
| `public` | `public`（公开可用）/ `restricted`（限制访问）/ 空（未知） |
| `commissioned_year` | 投运年份（德国/法国官方注册数据；OCM 无此字段） |

GeoJSON 要素属性使用短键以控制体积：`o`=运营商索引、`p`=功率 kW(-1 未知)、`c`=功率档位(-1 未知)、`t`=交直流(0/1/2)、`n`=充电点数、`s`=状态码、`nm`=名称、`ct`=城市、`cn`=接口数组、`yr`=投运年份、`pb`=公开标记。

## 使用说明

- **默认加载** Top 8 国家（DE/FR/GB/ES/IT/NL/SE/NO，约 25 万站）；在左侧勾选更多国家按需加载
- **地图**：聚类圆（点击展开）→ 单点（点击查看详情弹窗）；缩放至 12 级以上显示单点
- **图层**：热力图 / 0.5° 密度网格（随筛选实时重算）/ 聚集城市标注（点击飞行定位）
- **图表联动**：所有统计卡片与图表随筛选条件实时重算；点击城市/运营商图表项可与地图联动
- **筛选**：国家、功率类型、交直流、接口、状态、访问权限可多选；运营商支持模糊搜索（约 1.24 万家，OCM 来源名称存在碎片化，属数据固有特性）

## 已知数据口径说明

1. 德国为官方注册表口径（Ladeeinrichtung 站点级）；法国为 IRVE 国家汇总口径（约覆盖全国 85% 充电点）；其余国家为 OCM 社区汇总，覆盖度因国而异（如 PL/BG 等偏低），**跨国比较时请注意口径差异**
2. 功率未知率约 0.8%（主要来自 OCM 少数记录）；「投运年份趋势」仅统计德/法官方数据
3. OCM 数据快照为 2026-04（官方导出仓库更新频率），德/法为 2026-09/10 最新
4. 人均 / 面积密度使用 World Bank 2023 年静态人口与国土面积计算

## 致谢与许可

- 数据：Bundesnetzagentur (CC BY 4.0)、Etalab/ODRE (Licence Ouverte 2.0)、Open Charge Map (CC BY 4.0)、World Bank (CC BY 4.0)、Natural Earth (公有领域)
- 底图：© OpenStreetMap contributors © CARTO
- 库：MapLibre GL JS (BSD-3-Clause)、Apache ECharts (Apache-2.0)
- 使用方请在再发布时保留上述署名

## HTML 深度分析报告

打开 `http://localhost:8080/analysis-report/dist/`。报告包含 23 张统计图、1 张支持数量/功率占比切换的欧洲空间网格地图，以及国家明细表。分析涉及国家类型与访问条件、城市与运营商集中度、接口组合、站点容量分布、投运队列及国别数据缺口。

复算交叉指标：`python3 scripts/analyze_report.py`。该脚本读取固定的 `data/stations.csv` 并更新报告内的聚合证据，不修改原始数据；随后需通过 Data app 构建流程重新编译报告。报告源代码位于 `analysis-report/src/content/report/`。

报告核验发现：原 ETL 的最高功率档实际为 **>50 kW**，而原地图标签为 ≥50 kW；报告明确区分档位与数值阈值。另有一条 `num_points=-4` 的异常记录，报告单列披露，原 CSV 保留用于对账。

### 空间叙事与可达性专题

新版报告参考 Mapular 的地图叙事方式，独立计算 H3 r5 面积归一密度、公开运营中非快充站点到最近快充站点的球面距离、10/25/50公里筛查情景，以及德国现存登记点的投运年份累计回放。距离不是道路里程，筛查阈值不是 AFIR 合规门槛。23张原有统计图与明细表保留在可展开证据图集中。

复现新增空间指标前，在隔离环境中安装 `scripts/report-geo-requirements.txt`，再运行 `python scripts/analyze_accessibility.py`。完成报告核验后将 `buildStatus` 设为 `complete` 并使用原 Data app 流程构建、导出。该脚本不抓取外部数据，不修改站点CSV。

新发现的坐标质量线索：193条德国远距记录共享54.32459°N、7.36405°E，城市字段标为Böblingen；报告将其列为待核验记录，保留原数据，并给出排除该组的敏感性情景。
