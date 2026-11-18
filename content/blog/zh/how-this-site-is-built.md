---
title: "這個網站是怎麼建的：用 Next.js 做一個免費的全靜態部落格"
description: "這個網站背後的完整技術堆疊——Next.js 靜態匯出、Markdown 內容、Tailwind CSS，以及 $0 的託管——還有讓它又快又能被找到的具體設定。"
date: "2026-10-08"
tags: ["nextjs", "static-site", "webdev"]
featured: true
---

**TL;DR：** 這個部落格是一個匯出成純 HTML 的 Next.js 應用（`output: 'export'`），文章用 Markdown 撰寫、Tailwind CSS 排版，部署在免費的 CDN 上。沒有伺服器、沒有資料庫、沒有每月帳單。這篇文章會走一遍整體架構和關鍵的設定取捨。

常有人問，一個「簡單的部落格」為什麼需要 Next.js。老實說？並不*需要*——但它用很小的代價換來很多東西：檔案式路由、build time 渲染、一流的 metadata 處理，以及一個逃生口——哪天想升級成更豐富的元件也不成問題。以下是從頭到腳的完整堆疊。

## 技術堆疊

| 層 | 選擇 | 為什麼 |
| --------- | ------------------------------------- | --------------------------------------- |
| 框架 | Next.js（App Router、靜態匯出） | React 開發體驗，零執行時伺服器 |
| 內容 | `/content` 裡的 Markdown + frontmatter | 任何編輯器都能寫，用 git 做版本管理 |
| 樣式 | Tailwind CSS v4 | 快速的預設值，暗色模式輕鬆搞定 |
| 渲染 | remark/rehype + Shiki | GFM、標題錨點、雙主題程式碼高亮 |
| 託管 | 免費靜態主機（CDN） | $0，全球邊緣節點遞送 |

## 一行設定的靜態匯出

核心就是一個設定旗標：

```ts
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",      // build 後產出純 HTML 的 out/ 資料夾
  trailingSlash: true,   // /blog/index.html 形式的 URL，對靜態主機友善
  images: { unoptimized: true }, // 不需要圖片伺服器
}

export default nextConfig
```

有了 `output: "export"`，`next build` 會產出一個完全自包含的 `out/` 目錄，可以直接丟到任何靜態檔案主機上。因為頁面在 build time 就預渲染好了，TTFB 就只是 CDN 延遲——全球通常低於 100ms。

## 內容就是 Markdown 檔案

每篇文章都是一個 `content/blog/my-post.md` 這樣的檔案：

```markdown
---
title: "My Post"
description: "讀者能從中得到什麼。"
date: "2026-10-08"
tags: ["nextjs"]
faq:
  - q: "讀者常問的問題？"
    a: "簡短回答，同時也會輸出成 FAQ 結構化資料。"
---

**TL;DR：** 給略讀者和 AI 回答引擎的一段話版本。
```

Build time 時一條小流水線（remark → rehype → Shiki）把它變成有樣式的 HTML：標題自帶錨點、程式碼區塊語法高亮且同時支援亮色*和*暗色主題，另外從標題抽取出目錄。

## SEO 大部分是 metadata 的基本功

靜態 HTML 已經幫你完成了好 SEO 的 80%。剩下 20% 是紀律：

- 每頁唯一的 `<title>` 和 meta description，從 frontmatter 生成。
- 用 `metadataBase` 生成 canonical URL，搬家換網域也不怕。
- Open Graph 和 Twitter card 圖片在 **build time** 用 `next/og` 渲染——不需要圖片服務。
- `sitemap.xml`、`robots.txt` 和 RSS feed，全部從內容清單生成。
- 每頁都有 `WebSite`、`Person`、`BlogPosting` 和麵包屑的結構化資料（JSON-LD）。

## 在此之上再最佳化 AI 搜尋

因為 HTML 是靜態且語義化的，LLM 爬蟲本來就讀得懂這個網站。我加了兩個零成本的小東西：

1. **`llms.txt`** —— 按照 [llmstxt.org](https://llmstxt.org) 慣例，一份全站的 Markdown 索引。
2. **`llms-full.txt`** —— 每篇文章的純 Markdown 版本，一個 URL，沒有導航干擾。

也就是說，聊天機器人被問到「怎麼建一個免費的靜態部落格」時，可以直接把答案吃進去。想看細節的話，我寫了一篇完整的[生成式引擎最佳化指南](/zh-TW/blog/optimize-content-for-ai-search-engines-geo/)。

## 花了多少錢

零。Repo 免費，build 跑在免費的 CI 額度上，CDN 免費，子網域也免費。錢在這裡唯一買得到的東西是自訂網域——有更好，沒有也行。

## 收尾

整個網站就是幾百行 TypeScript，圍著一個裝滿 Markdown 的資料夾。如果你正在考慮開一個部落格，現在是個好時機：工具鏈終於把「快、免費、能被找到」變成了預設值，而不是一個專案。
