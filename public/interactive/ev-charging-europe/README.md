# 欧洲充电网络博客附件

此目录保存 2026-10-20 项目的固定快照，供博客中的交互地图和报告使用。

- `index.html`、`assets/` 与 `data/geojson/` 为交互地图及 48 个国家的数据层。
- `analysis-report/dist/` 为原报告完整构建产物，HTML、数据 sidecar 和构建清单保持原样。
- `analysis-report/index.html` 为独立阅读包装页，适配返回地图及数据下载路径。
- `data/stations.csv.gz` 为原始站点 CSV 的无损 gzip 版本。解压后与项目原文件逐字节一致。
- `SOURCE-README.md` 为原项目说明，涵盖数据字典、来源与许可。

博客集成仅调整地图的报告链接与最高功率档显示标签。原 ETL 最高功率档为 >50 kW，原文误标为 ≥50 kW；本副本修正筛选、图例和统计标签，不改变站点分类与原始数据。交直流类型继续由独立字段表示。

数据署名：Bundesnetzagentur（CC BY 4.0）、Etalab/ODRE（Licence Ouverte 2.0 / ODbL）、Open Charge Map（混合许可，含提供方条款）、World Bank（CC BY 4.0）、Natural Earth（公有领域）。在线底图为 © OpenStreetMap contributors © CARTO。依赖为 MapLibre GL JS（BSD-3-Clause）、Apache ECharts（Apache-2.0）；完整报告保留其原有来源、方法与参考说明。
