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

## Features

- **Zero configuration** — no API keys, no accounts, no setup
- **Works offline** — analyzes directly via HTTP, no third-party APIs
- **Fast** — parallel link checking, lightweight HTML parsing
- **Comprehensive** — SEO + accessibility + security + performance in one server
- **Privacy-friendly** — no data sent to any analytics service

## Requirements

- Node.js 18+
- That's it.

## More Tools & Templates

Want to build and monetize your own MCP server?

👉 [MCP Server 开发变现实战包](https://ifdian.net/item/fdfddfb02c1311f1ae625254001e7c00) — includes TypeScript templates, market research data, niche analysis, monetization guide, and promotion templates. ¥19.9

## License

MIT
