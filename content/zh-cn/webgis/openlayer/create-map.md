+++
title="创建地图"
date = "2020-10-22"
description = "openlayer创建地图"
featured = false
categories = [
  "openlayer"
]
tags = [
  "openlayer"
]
+++

openlayer 加载天地图创建地图

![u=2640471829,4270483104&fm=26&gp=0.jpg][1]

<!--more-->

# 安装 openlayers

`npm i ol -S`

# 引入需要的包

```javascript
import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import { transform } from 'ol/proj.js';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
```

# 加载天地图在线瓦片地图

- 在线瓦片地址

```js
    矢量图： "http://t2.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=你的token"
    影像图： "http://t2.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=你的token"
    地形图： "http://t2.tianditu.com/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk=你的token"
```

- 坐标系转换

  > 默认坐标系为`EPSG:3857`，坐标转换成`EPSG:4326`，利用`ol/proj.js`的`transform`方法：

```javascript
let center = transform([10419419.755901294, 4222817.223109004], 'EPSG:3857', 'EPSG:4326');
```

- 利用接口`XYZ`实现加载瓦片

```javascript
var map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        url: 'http://t2.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=你的token',
      }),
      visible: true,
      name: 'basemap',
    }),
  ],
  view: new View({
    minZoom: 7,
    maxZoom: 22,
    center: center,
    zoom: this.zoom,
    projection: 'EPSG:4326',
  }),
});
```

[1]: https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2640471829,4270483104&fm=26&gp=0.jpg
