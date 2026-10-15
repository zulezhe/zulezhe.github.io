# 个人博客 / 作品集（Next.js 纯静态）

一个面向海外访客的**纯静态**个人博客：展示作品 + 写博文，SEO 与 GEO（生成式引擎优化）开箱即用，
全流程 **$0 成本**（免费托管 + 免费子域名 + 免费 CI/CD）。

## 技术栈

| 层 | 方案 |
| --- | --- |
| 框架 | Next.js 15（App Router，`output: 'export'` 静态导出） |
| 样式 | Tailwind CSS v4 + 深色模式 |
| 内容 | Markdown + frontmatter（`content/` 目录，git 版本化管理） |
| 渲染 | remark/rehype + Shiki 代码高亮（明暗双主题） |
| 部署 | 静态 `out/` 目录，托管到任意免费静态主机 |

## 已内置的 SEO / GEO 能力

**传统 SEO**

- 每页独立 `<title>` / description / canonical URL
- Open Graph + Twitter 卡片，文章 OG 图片**构建时**用 `next/og` 自动生成
- `sitemap.xml`、`robots.txt`、`manifest`、RSS (`/rss.xml`) 自动生成
- JSON-LD 结构化数据：`WebSite`、`Person`、`BlogPosting`、`CreativeWork`、`BreadcrumbList`
- 语义化 HTML、heading 锚点、自动目录（TOC）、面包屑导航
- 标签页（`/blog/tag/xx/`）扩展长尾收录面

**GEO（面向 ChatGPT / Perplexity / Claude 等 AI 搜索）**

- `/llms.txt`：全站 markdown 索引（[llmstxt.org](https://llmstxt.org) 规范）
- `/llms-full.txt`：全站文章纯文本，一次请求可抓全
- 文章支持 `faq:` frontmatter → 自动渲染 FAQ 区块 + `FAQPage` 结构化数据
- 内容模板自带 TL;DR 区块，鼓励"答案前置"的可引用写法
- 纯静态语义化 HTML，AI 爬虫（GPTBot 等）无需执行 JS 即可读取

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
```

写作就是在 `content/blog/` 里加一个 `.md` 文件（参考 `content/blog/_template.md`），
作品在 `content/projects/` 里加（参考 `content/projects/_template.md`）。

```bash
npm run build      # 产出纯静态文件到 out/
npm run preview    # 本地预览 out/ 的真实效果
```

## 改成你自己的（唯一必改文件）

编辑 **`lib/site.ts`**：姓名、标题、简介、GitHub / X / 邮箱链接。
About 页正文在 `app/about/page.tsx`（搜 `EDIT ME`）。

## 免费部署（三选一，都是 0 成本）

### 方案 A：Cloudflare Pages（推荐，海外访客最快）

1. 代码推到 GitHub（`git init && git add -A && git commit -m "init" && git push`）
2. [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → 连接该仓库
3. 构建配置：**Build command** `npm run build`，**Build output directory** `out`
4. 完成后获得免费域名 `https://<项目名>.pages.dev`
   （免费额度：带宽无限，500 次构建/月）

> 记得把 `lib/site.ts` 里的 `url` 改成你的 `*.pages.dev` 域名（或自定义域名），
> 保证 canonical / sitemap / OG 链接正确。

### 方案 B：GitHub Pages（最简单，仓库在哪站点在哪）

仓库已自带 `.github/workflows/deploy.yml`：

1. GitHub 建仓并推送代码
2. 仓库 **Settings → Pages → Source 选 "GitHub Actions"**
3. 之后每次 push 到 `main` 自动构建部署
   - 仓库名为 `<用户名>.github.io` → 站点 `https://<用户名>.github.io`
   - 其他名字 → 站点 `https://<用户名>.github.io/<仓库名>/`（basePath 会自动处理）

（免费额度：100GB 流量/月，公开仓库免费）

### 方案 C：Vercel（Next.js 亲儿子）

1. [vercel.com](https://vercel.com) → Import Git Repository
2. 零配置，自动识别 Next.js，直接部署
3. 免费域名 `https://<项目名>.vercel.app`
   （Hobby 计划：100GB 流量/月，限非商业用途）

> 三个平台随时可换、可并存。以后买了自定义域名（约 $10/年），改 DNS 指向即可，
> 站内所有链接通过 `lib/site.ts` 的 `url` 一处切换。

## 可选增强（都免费）

- **评论**：[giscus.app](https://giscus.app)（基于 GitHub Discussions）——把生成的 4 个参数填进 `lib/site.ts` 的 `giscus` 字段即开启
- **统计**：Cloudflare Web Analytics（免费无 Cookie）——把 token 填进 `lib/site.ts` 的 `analytics.cloudflareBeacon`
- **搜索收录**：[Google Search Console](https://search.google.com/search-console) 验证码填进 `lib/site.ts` 的 `verification.google`，提交 `https://你的域名/sitemap.xml`
- **AI 收录**：无需操作，`llms.txt` 已就位；可在 Search Console 观察 GPTBot 等爬虫的抓取

## 目录结构

```
├── app/                  # 路由（全部静态导出）
│   ├── page.tsx          # 首页：hero + 精选作品 + 最新文章
│   ├── blog/             # 博客列表 / 文章页 / 标签页
│   ├── projects/         # 作品集列表 + 详情页
│   ├── about/            # 关于我
│   ├── rss.xml / llms.txt / llms-full.txt   # 动态生成的静态文件
│   └── sitemap.ts / robots.ts / manifest.ts
├── components/           # UI 组件
├── content/
│   ├── blog/             # 博文（Markdown + frontmatter）
│   └── projects/         # 作品（Markdown + frontmatter）
├── lib/                  # site 配置 / 内容读取 / markdown 渲染
└── .github/workflows/    # GitHub Pages 自动部署
```
