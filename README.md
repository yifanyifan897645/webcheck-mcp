# WebCheck MCP Server

[English](#english) | [中文](#中文)

---

<a id="中文"></a>

## 中文

一个 MCP (Model Context Protocol) 服务器，让 AI 助手能够自动分析任意网站的 SEO、无障碍性、安全性和性能问题。

**每周 600+ 次下载** — 5 个强大工具，无需 API Key，开箱即用。

### 工具列表

| 工具 | 功能 |
|------|------|
| `check_website` | 全面体检：SEO评分、性能、安全头、图片分析 |
| `check_seo` | 深度SEO审计：标题、meta、标题层级、内容质量、Open Graph、结构化数据 |
| `check_accessibility` | 无障碍扫描：alt文本、ARIA标记、标题层级、表单标签 |
| `find_broken_links` | 爬取页面所有链接，报告404、超时、重定向 |
| `compare_pages` | 两个URL的SEO和性能指标并排对比 |

### 快速开始

**Claude Code：**
```bash
claude mcp add webcheck -- npx webcheck-mcp
```

**Claude Desktop** — 添加到 `claude_desktop_config.json`：
```json
{
  "mcpServers": {
    "webcheck": {
      "command": "npx",
      "args": ["webcheck-mcp"]
    }
  }
}
```

**Cursor / Windsurf：**
```json
{
  "webcheck": {
    "command": "npx",
    "args": ["webcheck-mcp"]
  }
}
```

### 使用示例

安装后，直接对 AI 助手说：

- *"检查 https://mysite.com 的SEO"*
- *"找出我首页的死链"*
- *"对比我的网站和竞品的SEO"*
- *"对 https://example.com 做一次全面体检"*
- *"检查我落地页的无障碍问题"*

### 特性

- **零配置** — 不需要 API Key、不需要注册、不需要设置
- **本地运行** — 直接通过 HTTP 分析，不依赖第三方 API
- **速度快** — 并行链接检查，轻量级 HTML 解析
- **全面** — SEO + 无障碍 + 安全 + 性能，一个服务器搞定
- **隐私友好** — 不会向任何分析服务发送数据

### Pro Report

免费版提供**完整分析数据**——没有任何隐藏。想要更多？

**[Pro Report (¥9.9) →](https://ifdian.net/item/86d05cc02ce911f19d8e5254001e7c00)** 额外提供：
- 个性化修复指南（含代码片段）
- 优先级排序（先修什么影响最大）
- 竞品对标分析
- 月度追踪建议

### MCP 开发模板包

想自己开发 MCP Server？从模板开始，跳过踩坑阶段。

**[MCP开发实战模板包 (¥19.9) →](https://mbd.pub/o/bread/YZWclJhxaA==)** 包含：
- 完整 MCP Server 代码模板（TypeScript）
- npm 发布检查清单
- 多平台配置指南（Claude/Cursor/Windsurf）

---

<a id="english"></a>

## English

A Model Context Protocol (MCP) server that gives AI assistants the ability to analyze any website for SEO, accessibility, security, and performance issues.

**600+ weekly downloads** — 5 powerful tools, no API keys required.

### Tools

| Tool | What it does |
|------|-------------|
| `check_website` | Full health check: SEO score, performance, security headers, image analysis |
| `check_seo` | Deep SEO audit: title, meta, headings, content quality, Open Graph, structured data |
| `check_accessibility` | Accessibility scan: alt texts, ARIA landmarks, heading hierarchy, form labels |
| `find_broken_links` | Crawl all links on a page and report 404s, timeouts, and redirects |
| `compare_pages` | Side-by-side comparison of two URLs across all metrics |

### Quick Start

**Claude Code:**
```bash
claude mcp add webcheck -- npx webcheck-mcp
```

**Claude Desktop** — add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "webcheck": {
      "command": "npx",
      "args": ["webcheck-mcp"]
    }
  }
}
```

**Cursor / Windsurf:**
```json
{
  "webcheck": {
    "command": "npx",
    "args": ["webcheck-mcp"]
  }
}
```

### Example Usage

Once installed, just ask your AI assistant:

- *"Check the SEO of https://mysite.com"*
- *"Find broken links on my homepage"*
- *"Compare my site's SEO with my competitor"*
- *"Run a full website audit on https://example.com"*
- *"Check accessibility issues on my landing page"*

### Features

- **Zero configuration** — no API keys, no accounts, no setup
- **Works offline** — analyzes directly via HTTP, no third-party APIs
- **Fast** — parallel link checking, lightweight HTML parsing
- **Comprehensive** — SEO + accessibility + security + performance in one server
- **Privacy-friendly** — no data sent to any analytics service

### Pro Report

The free tool gives you **full analysis** — nothing is hidden. Want more?

**[Pro Report (¥9.9 / ~$1.4) →](https://ifdian.net/item/86d05cc02ce911f19d8e5254001e7c00)** adds:
- Personalized step-by-step fix guide with code snippets
- Priority ranking (what to fix first for maximum impact)
- Competitor benchmark comparison
- Monthly tracking recommendations

## Part of the MCP Toolkit

**[View all servers →](https://yifanyifan897645.github.io/mcp-toolkit/)**

- [webcheck-mcp](https://www.npmjs.com/package/webcheck-mcp) — Website health analysis / 网站健康分析
- [git-summary-mcp](https://www.npmjs.com/package/git-summary-mcp) — Git repository intelligence
- [mcp-checkup](https://www.npmjs.com/package/mcp-checkup) — MCP setup health analyzer
- [dev-utils-mcp](https://www.npmjs.com/package/dev-utils-mcp) — Developer utilities
- [codescan-mcp](https://www.npmjs.com/package/codescan-mcp) — Codebase health scanner
- [deadlink-checker-mcp](https://www.npmjs.com/package/deadlink-checker-mcp) — Dead link detector

## License

MIT
