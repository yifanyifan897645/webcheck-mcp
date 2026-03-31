# WebCheck MCP Server

A Model Context Protocol (MCP) server that gives AI assistants the ability to analyze any website for SEO, accessibility, security, and performance issues.

**5 powerful tools** your AI assistant can use to audit any URL — no API keys required.

## Tools

| Tool | What it does |
|------|-------------|
| `check_website` | Full health check: SEO score, performance, security headers, image analysis |
| `check_seo` | Deep SEO audit: title, meta, headings, content quality, Open Graph, structured data |
| `check_accessibility` | Accessibility scan: alt texts, ARIA landmarks, heading hierarchy, form labels |
| `find_broken_links` | Crawl all links on a page and report 404s, timeouts, and redirects |
| `compare_pages` | Side-by-side comparison of two URLs across all metrics |

## Quick Start

### With Claude Code

```bash
claude mcp add webcheck -- npx webcheck-mcp
```

### With Claude Desktop

Add to your `claude_desktop_config.json`:

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

### With Cursor / Windsurf

Add to your MCP configuration:

```json
{
  "webcheck": {
    "command": "npx",
    "args": ["webcheck-mcp"]
  }
}
```

## Example Usage

Once installed, just ask your AI assistant:

- *"Check the SEO of https://mysite.com"*
- *"Find broken links on my homepage"*
- *"Compare my site's SEO with my competitor"*
- *"Run a full website audit on https://example.com"*
- *"Check accessibility issues on my landing page"*

## Sample Output

```
> check_seo("https://news.ycombinator.com")

SEO Score: 60/100

Priorities:
- HIGH: Add a meta description (150-160 characters)
- MEDIUM: Add an H1 heading

Issues:
- Title too short (11 chars, recommend 50-60)
- No canonical URL set
- No structured data (JSON-LD)
- Missing Open Graph tags
```

## Free vs Pro

| | Free | Pro Report |
|---|---|---|
| SEO / accessibility scores | ✅ | ✅ |
| Top 3 issues | ✅ | ✅ |
| Full issue list + suggestions | 🔒 | ✅ |
| Heading structure details | 🔒 | ✅ |
| Complete image audit | 🔒 | ✅ |
| Priority-ordered action plan | 🔒 | ✅ |
| Price | Free forever | ¥9.9 (~$1.4) |

**[Get Pro Report →](https://ifdian.net/item/86d05cc02ce911f19d8e5254001e7c00)** — WeChat Pay / Alipay

## Features

- **Zero configuration** — no API keys, no accounts, no setup
- **Works offline** — analyzes directly via HTTP, no third-party APIs
- **Fast** — parallel link checking, lightweight HTML parsing
- **Comprehensive** — SEO + accessibility + security + performance in one server
- **Privacy-friendly** — no data sent to any analytics service

## Requirements

- Node.js 18+
- That's it.

## Part of the MCP Toolkit

**[View all servers →](https://yifanyifan897645.github.io/mcp-toolkit/)**

- [webcheck-mcp](https://www.npmjs.com/package/webcheck-mcp) — Website health analysis
- [git-summary-mcp](https://www.npmjs.com/package/git-summary-mcp) — Git repository intelligence
- [mcp-checkup](https://www.npmjs.com/package/mcp-checkup) — MCP setup health analyzer
- [dev-utils-mcp](https://www.npmjs.com/package/dev-utils-mcp) — Developer utilities
- [codescan-mcp](https://www.npmjs.com/package/codescan-mcp) — Codebase health scanner

## MCP Power User Kit

Get the MCP Power User Kit — 7 config files, optimization guide, 4 registry templates, and 2 setup scripts for Claude Code, Cursor, and Windsurf. [¥19.9 on 爱发电](https://afdian.com/item/fdfddfb02c1311f1ae625254001e7c00)

## License

MIT
