# 博客 i18n：英文（默认，无前缀）+ 繁体中文（/zh-TW/）

## Context

博客已上线（dyzyzj.top，GitHub Pages 静态托管），全站硬编码英文。目标：增加 i18n 配置，支持英文 + 繁体中文两种语言。约束：`output: "export"` 纯静态（无 middleware）、不破坏现有英文 URL 的收录。范围：翻译 UI 层（导航/按钮/标题/日期/404/About/交互可视化），文章正文保持英文，保留现有 `translations` frontmatter 结构供以后逐篇翻译；不做自动语言跳转，仅在导航栏提供手动切换。零新依赖（符合项目手写风格，也避开本机 Nexus 镜像会污染 lock 文件的坑）。

已验证：Next 15.5.28 支持 `experimental.globalNotFound`（多根布局下生成全局 404 所需）。

## 1. 新建 lib/i18n/（字典 + 工具）

- `lib/i18n/config.ts`：`locales = ["en", "zh-TW"] as const`、`defaultLocale = "en"`、`type Locale`、`localeNames`（English / 繁體中文）、`isLocale()` 守卫、`localizedPath(locale, path)`（en 原样、zh-TW 加 `/zh-TW` 前缀）。
- `lib/i18n/dictionaries/en.ts`：全量 UI 文案（嵌套对象，`type Dictionary = typeof en`）。
- `lib/i18n/dictionaries/zh-TW.ts`：`satisfies Dictionary`。
- `lib/i18n/index.ts`：`getDictionary(locale)`（纯同步取对象）、`formatDate(locale, iso)`（Intl，en-US → "January 5, 2026"、zh-TW → "2026年1月5日"）、`languageAlternates(path)`（hreflang 对：`{ en, "zh-TW", "x-default" }`，复用 `absUrl()`）。

字典分区（来源为已盘点的字符串）：nav、home、blog、post（面包屑/updated/min read/FAQ/←Older/Newer）、explorer（PostExplorer 搜索/排序/空状态）、projects、about（整页繁中版散文）、notFound、readingTools、toc、comments、copyCode、footer、themeToggle、localeSwitcher。

## 2. 路由重构：双根布局（route groups）

```
app/
  (en)/                ← 现 app/ 下页面整体 git mv 进来，URL 不变
    layout.tsx         ← 现 app/layout.tsx，<html lang="en">
    page.tsx  about/  blog/  projects/  opengraph-image.tsx
  (zh-TW)/
    layout.tsx         ← 根布局 #2，<html lang="zh-TW">（zh 关键词、JSON-LD inLanguage）
    zh-TW/             → /zh-TW/…
      page.tsx  about/  blog/[slug]  blog/tag/[tag]  projects/[slug]  opengraph-image.tsx …
  global-not-found.tsx ← 完整 html 文档的 404（experimental.globalNotFound: true）
  rss.xml/  llms.txt/  llms-full.txt/  sitemap.ts  robots.ts  manifest.ts  icon.svg  globals.css  ← 不动
```

- 页面实现不复制：把现页面 JSX/metadata 抽成 `components/pages/`（如 `HomeContent`、`BlogPostContent`、`BlogIndexContent`、`TagArchiveContent`、`ProjectsContent`、`ProjectDetailContent`、`AboutContent`），签名 `{ locale, ...props }`；各 locale 的 page 文件只做 ~15 行薄包装（`generateStaticParams` + `generateMetadata` + 传 locale）。
- 若 `globalNotFound` + 静态导出构建验证失败：回退为单一根布局 + zh-TW 嵌套布局内联一行脚本设置 `documentElement.lang`（提前在首次 build 时验证）。

## 3. 客户端组件：props 传文案（零客户端 i18n 运行时）

服务端页面从 `getDictionary(locale)` 取对应切片经 props 下传；`Header`（已是 client）增加 `locale` prop 构建本地化导航链接。新增 `components/LocaleSwitcher.tsx`（client，`usePathname()` 推算对应语言 URL：`/zh-TW` 前缀增删），放 Header 主题切换旁。

改：`Header.tsx`、`Footer.tsx`、`PostCard.tsx`、`ProjectCard.tsx`、`ReadingTools.tsx`、`TableOfContents.tsx`、`Giscus.tsx`（`data-lang` 按 locale：en / zh-TW）、`CopyCode.tsx`、`ThemeToggle.tsx`、`PostExplorer.tsx`（含改用 `formatDate(locale, …)`）、not-found（由 global-not-found 承接）。

## 4. lib 与 SEO 层

- `lib/posts.ts`：`formatDate(iso, locale = "en-US")` 加可选 locale；其余不动（`translations`/`translationOf` 管线保留）。
- `lib/site.ts`：`pageMetadata()` 增加 `locale?: Locale` → `og.locale` 输出 `en_US`/`zh_TW`；新增 `languageAlternates` 供各页 hreflang。
- `sitemap.ts`：每条 en URL 附 zh-TW alternate + `/zh-TW/` 页面条目；`rss.xml`、`manifest.ts`、`llms.txt` 保持英文不动。
- 根 opengraph-image 保持英文（社交卡片）。

## 5. 交互可视化双语

- `components/ChargingEurope.tsx`：现有 `COPY`（en/简中）扩展为 en/zh-TW，language prop 改为 `"en" | "zh-TW"`（数据路径逻辑不变，顶层 `data/` 仍存在）。
- `components/EarthquakePulse.tsx` + `components/earthquake/*`：仿 ChargingEurope 模式新建 `components/earthquake/copy.ts`（en/zh-TW 字典），language prop 逐层下传；`PulseWall` 月份标签、`DepthColumns`/`EnergyLedger` 数字格式化改 locale-aware Intl（zh-TW）。博客页渲染器按 locale 传值。

## 6. next.config.ts

`experimental: { globalNotFound: true }`。

## 验证

1. `npm run typecheck`
2. `npm run build` → 检查 `out/`：`404.html` 仍生成（globalNotFound 生效）、`out/zh-TW/` 树完整、zh 页面 `<html lang="zh-TW">`
3. `npx serve out` + 浏览器抽查：`/` 与 `/zh-TW/` 渲染、切换按钮双向跳转正确、博客详情/标签页/Projects 两语言均正常、地震可视化 zh-TW 文案生效
4. 查 `sitemap.xml` hreflang、页面 `<link rel="alternate" hreflang>`、og:locale
5. 完成后提交（用户确认再推送部署）
