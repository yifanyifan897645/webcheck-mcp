# Website Audit Tool for Agencies & Freelancers

You're a web agency. A potential client asks you to audit their site. Instead of spending 2 hours manually checking SEO, broken links, accessibility, and security headers, run WebCheck and get a professional audit report in seconds.

Paste any URL, pick your audit modules, and get back structured findings with scores, prioritized issues, and actionable fix recommendations -- ready to drop into a proposal or client report.

## How agencies use WebCheck

### 1. Prospect auditing (lead generation)

You found a local business with a bad website. Run a quick WebCheck audit on their homepage and top 3 pages. In 30 seconds you have a concrete list of problems: missing meta descriptions, broken links, no HTTPS, accessibility failures. Send them a short email: "I found 12 issues on your site -- here are the top 3 costing you traffic. Want me to fix them?" You just turned a cold lead into a warm conversation.

### 2. Sales call preparation

A prospect booked a discovery call. Before the call, run WebCheck on their site and their top competitor's site. Show up with a side-by-side comparison: "Your SEO score is 54, your competitor scores 81. Here's exactly why." You're no longer pitching -- you're diagnosing. Clients close faster when you show them specific problems with data behind them.

### 3. Client deliverables and ongoing monitoring

You closed the deal. Now schedule WebCheck to run weekly on the client's site. Use the detailed report format to generate structured audit data for your monthly reports. Track scores over time to prove ROI: "When we started, your SEO score was 54. After our work, it's 78. Here are the remaining items for next month." Retention goes up when clients see measurable improvement.

## What WebCheck audits

WebCheck runs up to four independent audit modules on each URL:

1. **Full Analysis** -- SEO score, response time rating, security header check (HSTS, CSP, X-Frame-Options), image alt-text audit, and content quality assessment. The all-in-one overview for prospect reports.

2. **SEO Audit** -- Title and meta description length validation, heading hierarchy, word count, Open Graph and Twitter Card tags, structured data (JSON-LD), canonical URL, robots meta, and language attribute. The detail you need for SEO proposals.

3. **Accessibility Check** -- Image alt attributes, heading level skips, form label associations, ARIA landmarks, skip-to-content links, and language declaration. Essential for ADA/WCAG compliance services.

4. **Broken Link Finder** -- Crawls every link on the page (up to your configured limit), checks each one in parallel, and reports 404s, timeouts, and redirects. Nothing kills credibility like broken links -- and clients rarely know they have them.

Each audit returns a 0-100 score, a list of issues ranked by severity, and concrete suggestions for fixing them.

## Why agencies choose WebCheck

- **No setup, no overhead.** Paste a URL, hit Start. No API keys, no browser extensions, no accounts to configure. Bill your time on strategy, not tooling.
- **Batch processing.** Audit an entire client site or a list of prospects in one run. Pass 10 URLs and get 10 structured reports back.
- **Two report formats.** Use "summary" for quick prospect scans during outreach. Use "detailed" for full client deliverables with fix instructions.
- **Structured JSON output.** Every result is machine-readable. Feed it into your reporting dashboard, Google Sheets, or CRM pipeline.
- **Lightweight and fast.** Pure HTTP-based analysis with parallel link checking. Audits complete in seconds, not minutes.
- **White-label ready.** The output is raw data -- no branding, no watermarks. Present it however you want in your own reports and proposals.

## Input parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `urls` | array of strings | Yes | -- | Client or prospect URLs to audit. Each URL is processed independently. |
| `checks` | array of strings | No | `["full", "seo", "accessibility", "links"]` | Which audit modules to run. Options: `full`, `seo`, `accessibility`, `links`. |
| `maxLinksPerPage` | integer | No | `50` | Maximum links to verify per page during broken link audit. Use 50 for prospect scans, 150+ for full client reports. |
| `reportFormat` | string | No | `"summary"` | `"summary"` for quick prospect audits (key issues only) or `"detailed"` for full client reports (every finding with fix instructions). |

### Example: Quick prospect audit

```json
{
    "urls": [
        "https://prospect-business.com",
        "https://prospect-business.com/about"
    ],
    "checks": ["full", "seo"],
    "reportFormat": "summary"
}
```

### Example: Full client site audit

```json
{
    "urls": [
        "https://client-site.com",
        "https://client-site.com/services",
        "https://client-site.com/contact",
        "https://client-site.com/blog"
    ],
    "checks": ["full", "seo", "accessibility", "links"],
    "maxLinksPerPage": 150,
    "reportFormat": "detailed"
}
```

## Sample output

Each URL produces one result object in the dataset. Here is a trimmed example from a full analysis:

```json
{
    "url": "https://example.com",
    "timestamp": "2026-03-31T12:00:00.000Z",
    "fullAnalysis": {
        "performance": {
            "responseTimeMs": 320,
            "contentLengthBytes": 48250,
            "rating": "fast"
        },
        "security": {
            "isHttps": true,
            "hasHsts": true,
            "hasContentSecurityPolicy": false,
            "hasXFrameOptions": true
        },
        "seo": {
            "score": 72,
            "title": "Example Site - Home",
            "titleLength": 19,
            "metaDescription": null,
            "hasViewport": true,
            "hasCanonical": false,
            "hasStructuredData": false,
            "wordCount": 450,
            "issues": [
                "Missing meta description",
                "Title too short (19 chars, recommend 50-60)",
                "2 image(s) missing alt text"
            ],
            "suggestions": [
                "Add a canonical URL to prevent duplicate content issues",
                "Add structured data (JSON-LD) for rich search results",
                "Add Open Graph tags for better social media sharing"
            ]
        },
        "images": {
            "total": 8,
            "missingAlt": 2
        }
    },
    "seo": {
        "score": 68,
        "title": { "value": "Example Site - Home", "length": 19, "status": "too_short" },
        "metaDescription": { "value": null, "length": 0, "status": "missing" },
        "headings": { "hasH1": true, "h1Count": 1, "hierarchyValid": true },
        "content": { "wordCount": 450, "status": "good" },
        "technical": {
            "viewport": true,
            "canonical": null,
            "structuredData": false
        },
        "social": {
            "hasOgImage": false,
            "twitterCard": null
        },
        "priorities": [
            "HIGH: Add a meta description (150-160 characters)",
            "CRITICAL: Switch to HTTPS"
        ],
        "issues": [
            "Title is shorter than recommended (aim for 50-60 chars)",
            "No canonical URL set",
            "No structured data (JSON-LD) found",
            "Missing og:title"
        ]
    },
    "brokenLinks": {
        "totalLinks": 45,
        "checked": 45,
        "broken": [
            { "url": "https://example.com/old-page", "status": 404 }
        ],
        "redirects": [
            { "url": "http://example.com/about", "redirectsTo": "https://example.com/about" }
        ],
        "healthy": 43,
        "summary": "Found 1 broken link(s) out of 45 checked."
    }
}
```

## Pricing

WebCheck uses **pay-per-event pricing**. You are charged for each URL audited. No flat monthly fee -- you pay only for what you use.

Running all four audit modules on a single URL counts as one event. Processing 10 URLs counts as 10 events. Check the pricing tab for the current per-event rate.

**Cost optimization for high-volume prospecting:**
- For initial prospect scans, use `reportFormat: "summary"` and only run `["full", "seo"]` checks.
- Save the full four-module detailed audit for clients you've already qualified.
- Keep `maxLinksPerPage` at 50 for prospect audits; increase for client deliverables.

## Integrations

WebCheck output is structured JSON, making it easy to plug into your existing agency workflow:

- **Apify API and client libraries** -- pull audit results programmatically in Python, JavaScript, or any language. Build custom reporting dashboards.
- **Scheduled runs** -- set up recurring weekly or monthly audits for client sites. Catch regressions automatically.
- **Webhooks** -- get notified when an audit completes and trigger your reporting pipeline.
- **Google Sheets / Excel** -- export results directly from the Apify console into client-ready spreadsheets.
- **Zapier / Make** -- connect WebCheck to your CRM: audit a prospect's site automatically when they enter your pipeline.

## Also available as an MCP server

If you use AI coding assistants (Claude, Cursor, Windsurf), WebCheck is also available as an MCP server that gives your AI assistant direct access to website audit tools:

```bash
npx webcheck-mcp
```

See the [webcheck-mcp npm package](https://www.npmjs.com/package/webcheck-mcp) for details.
