---
title: "GEO：如何讓你的內容被 AI 搜尋引擎引用"
description: "生成式引擎最佳化（GEO）實戰指南——讓你的網站成為 ChatGPT、Perplexity 和 Claude 引用的來源，附今天就能用的具體做法。"
date: "2026-09-28"
tags: ["seo", "geo", "content"]
featured: true
faq:
  - q: "SEO 裡的 GEO 是什麼？"
    a: "GEO（Generative Engine Optimization，生成式引擎最佳化）指的是讓你的內容容易被 AI 回答引擎——ChatGPT Search、Perplexity、Google AI Overviews、Claude——找到、信任並引用。它是對經典 SEO 的補充，而不是取代。"
  - q: "GEO 會取代傳統 SEO 嗎？"
    a: "不會。大多數 AI 引擎仍然用類似經典 SEO 的訊號（可爬性、權威性、新鮮度）去爬取和排序開放網路。GEO 是疊在上面的一層：讓你的內容在生成式回答中變得「可引用」的結構與措辭。"
  - q: "llms.txt 是什麼？"
    a: "llms.txt 是一個新興慣例（llmstxt.org）：放在網站根目錄的 Markdown 檔案，為 LLM 爬蟲索引你的內容——像 robots.txt 一樣，只是它是寫給 AI 助理而不是搜尋蜘蛛看的。"
  - q: "怎麼衡量 GEO 的成效？"
    a: "在日誌裡盯 AI 爬蟲（GPTBot、ClaudeBot、PerplexityBot）的到訪，追蹤品牌詞搜尋量的提升，並定期用你所在領域的問題去問各大家助理，看你有沒有被引用、是怎麼被引用的。"
---

**TL;DR：** 越來越多的「發現」發生在 AI 的回答裡，而不是「10 條藍色連結」裡。好消息是：讓內容對語言模型來說值得引用的基本功，和讓它對人類有用的基本功是同一套——清晰的結構、可引用的表述、真實的專業內容，加上乾淨的機器可讀標記。以下是完整的打法。

過去一兩年間的某個時刻，「搜尋」悄悄變成了「提問」。在買一個函式庫、規劃一趟旅行、或挑一家託管服務之前，我越來越習慣先問 ChatGPT 或 Perplexity——我認識的人也一樣。如果聊天機器人總結你的領域時，答案裡沒有你的名字，你就等於不存在。

這就是**生成式引擎最佳化（GEO）**要解決的問題。它比 SEO 年輕，規則還在沉澱，但方向已經清晰。以下是真的看起來有作用的東西——根據引擎官方揭露的資訊，以及實際被引用的案例。

## 1. 讓 AI 爬蟲能爬，而且是故意的

AI 助理用自家爬蟲、自家的 user agent——`GPTBot`、`ClaudeBot`、`PerplexityBot`、`Google-Extended` 等。兩個推論：

- 檢查你的 `robots.txt` 和 CDN 防火牆規則。某些安全預設值和「反 AI」外掛會直接擋掉這些爬蟲。擋是一個合理的選擇——但要出於深思熟慮，而不是意外。
- 以**靜態、語義化的 HTML** 提供內容。靠客戶端 JavaScript 渲染的 SPA，對不執行 JS 的爬蟲來說是黑箱。帶著真實標題、清單和表格的靜態 HTML則極易解析。（這個部落格採全靜態，正是為了這個原因。）

## 2. 把內容結構化到「可以被引用」

語言模型是靠*摘錄和濃縮*來回答的。把摘錄變容易：

- **開頭就給答案。** 每篇長文最上面放一段 TL;DR。如果模型只保留一個片段，確保那個片段就是回答問題的那段。
- **用問題或論斷句式寫描述性標題。**「如何在 Next.js 設定 canonical URL」勝過「設定」。
- **寫自包含的段落。** 一句話若必須配合前面三句才通順，被單獨引用時就活不下來。
- **可枚舉的事實用清單和表格。** 模型提取結構化資料比提取散文準確得多。
- **針對真實問題加 FAQ 區塊。** 問答格式與人們向助理提問的方式直接對應——還能順便當作 `FAQPage` 結構化資料。

## 3. 給機器結構化的 metadata

結構化資料既幫經典搜尋，*也*給語言模型可靠的事實錨點：

- 首頁放 `Person` 和 `WebSite` 的 JSON-LD——你是誰、這個站是什麼。
- 文章放 `BlogPosting`，帶可見的發布/更新日期、作者和字數。
- `BreadcrumbList` 讓層級關係不含糊。
- 日期也要**渲染在可見內容裡**，而不只是塞在 meta 標籤——模型只信它們讀得到的東西。

## 4. 發布 llms.txt

[llms.txt 慣例](https://llmstxt.org)聽起來像什麼就是什麼：根目錄的一份 Markdown 檔案，告訴 LLM 爬蟲站上有哪些內容，一個區塊一個區塊、一條連結一條連結。生成它只花一個下午，我的檔案概念上是這樣：

```markdown
# Oliver — Software Engineer & Writer

> Projects, engineering notes and web dev guides.

## Articles
- [Free static hosting compared](/blog/...): Cloudflare Pages vs
  GitHub Pages vs Vercel vs Netlify, with free-tier limits.
- [How this site is built](/blog/...): Next.js static export stack.
```

再配一份 `llms-full.txt`，收錄每篇文章的完整 Markdown，機器人一個請求就能吃下整個站。各家引擎目前用不用這些檔案還不一定——但讓自己可讀，沒有任何壞處。

## 5. 用老派的方式贏得引用

一個不舒服的事實：AI 引擎引用*有權威的來源*，而權威依然來自那些無聊的東西——原創資訊、能跑的 demo、真名實姓和真實日期、來自人們信任的網站的連結。持續發布具體、可驗證、一手內容的個人網站（「我實測了 X，repo 在這裡」）被引用的次數遠高於泛泛的清單文。專業深度是護城河；格式只是把它變得機器可讀。

## 怎麼知道有沒有效

實用的訊號，按投入程度由低到高：

1. **爬蟲日誌。** 在分析工具或伺服器日誌裡找 GPTBot / ClaudeBot / PerplexityBot 的蹤跡。
2. **品牌詞搜尋提升。** 搜你網站名稱的人變多，通常意味著更多人在某處看到了對你的引用。
3. **直接去問引擎。** 定期用你領域裡的問題查詢 ChatGPT 和 Perplexity，看你有沒有出現在來源裡。不科學，但既讓人清醒又有資訊量。

## 本週就開始

如果你想要一份按優先級排的短清單：把 `robots.txt` 對 AI 爬蟲修好、給最重要的十個頁面加 TL;DR 和 FAQ、輸出正確的 JSON-LD、發布 `llms.txt`，然後持續寫具體的一手內容。這就是今天 GEO 的 90%——順便說一句，這本來就是很好的寫作建議。
