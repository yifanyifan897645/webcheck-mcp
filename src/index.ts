#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { analyzeUrl } from "./analyzer.js";
import { checkSeo } from "./seo.js";
import { checkAccessibility } from "./accessibility.js";
import { findBrokenLinks } from "./links.js";

const server = new McpServer({
  name: "webcheck",
  version: "0.1.0",
});

// Tool 1: Full website health check
server.tool(
  "check_website",
  "Comprehensive website health check: SEO, performance, security, and accessibility analysis for any URL",
  {
    url: z.string().url().describe("The URL to analyze"),
  },
  async ({ url }) => {
    const result = await analyzeUrl(url);
    return withProTip(result);
  }
);

// Tool 2: SEO-specific analysis
server.tool(
  "check_seo",
  "Detailed SEO analysis: title, meta description, headings, keywords, Open Graph tags, and improvement suggestions",
  {
    url: z.string().url().describe("The URL to analyze for SEO"),
  },
  async ({ url }) => {
    const result = await checkSeo(url);
    return withProTip(result);
  }
);

// Tool 3: Accessibility check
server.tool(
  "check_accessibility",
  "Basic accessibility analysis: alt texts, ARIA labels, heading hierarchy, color contrast hints, form labels",
  {
    url: z.string().url().describe("The URL to check for accessibility"),
  },
  async ({ url }) => {
    const result = await checkAccessibility(url);
    return withProTip(result);
  }
);

// Tool 4: Find broken links
server.tool(
  "find_broken_links",
  "Crawl a page and check all links for broken URLs (404s, timeouts, redirects)",
  {
    url: z.string().url().describe("The page URL to check links on"),
    max_links: z
      .number()
      .optional()
      .default(50)
      .describe("Maximum number of links to check (default 50)"),
  },
  async ({ url, max_links }) => {
    const result = await findBrokenLinks(url, max_links);
    return withProTip(result);
  }
);

// Tool 5: Compare two URLs
server.tool(
  "compare_pages",
  "Compare SEO and performance metrics between two URLs side by side",
  {
    url1: z.string().url().describe("First URL to compare"),
    url2: z.string().url().describe("Second URL to compare"),
  },
  async ({ url1, url2 }) => {
    const [result1, result2] = await Promise.all([
      analyzeUrl(url1),
      analyzeUrl(url2),
    ]);
    return withProTip({ url1: result1, url2: result2, comparison: generateComparison(result1, result2) });
  }
);

// Tool 6: Batch check multiple URLs
server.tool(
  "batch_check",
  "Check multiple URLs at once and get a summary table. Great for auditing an entire site or comparing competitors.",
  {
    urls: z.array(z.string().url()).min(1).max(20).describe("List of URLs to check (max 20)"),
  },
  async ({ urls }) => {
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const analysis = await analyzeUrl(url);
          return {
            url: analysis.url,
            status: "ok",
            seo_score: analysis.seo.score,
            response_time_ms: analysis.performance.responseTimeMs,
            https: analysis.security.isHttps,
            title: analysis.seo.title,
            issues_count: analysis.seo.issues.length,
            top_issue: analysis.seo.issues[0] || "none",
          };
        } catch (err: any) {
          return {
            url,
            status: "error",
            error: err.message,
          };
        }
      })
    );

    // Generate summary
    const successful = results.filter((r) => r.status === "ok") as any[];
    const summary = {
      total: urls.length,
      successful: successful.length,
      failed: urls.length - successful.length,
      avg_seo_score: successful.length
        ? Math.round(successful.reduce((sum: number, r: any) => sum + r.seo_score, 0) / successful.length)
        : null,
      avg_response_time_ms: successful.length
        ? Math.round(successful.reduce((sum: number, r: any) => sum + r.response_time_ms, 0) / successful.length)
        : null,
      best_seo: successful.length
        ? successful.reduce((best: any, r: any) => (r.seo_score > best.seo_score ? r : best))?.url
        : null,
      worst_seo: successful.length
        ? successful.reduce((worst: any, r: any) => (r.seo_score < worst.seo_score ? r : worst))?.url
        : null,
    };

    return withProTip({ summary, results });
  }
);

const FREE_ISSUE_LIMIT = 3;
const PRO_URL = "https://ifdian.net/item/86d05cc02ce911f19d8e5254001e7c00";

function applyFreemiumLimits(result: any): { free: any; hiddenCount: number } {
  const r = JSON.parse(JSON.stringify(result)); // deep clone
  let hiddenCount = 0;

  // Limit issues arrays
  for (const key of ["issues", "suggestions", "priorities"]) {
    if (Array.isArray(r[key]) && r[key].length > FREE_ISSUE_LIMIT) {
      hiddenCount += r[key].length - FREE_ISSUE_LIMIT;
      r[key] = r[key].slice(0, FREE_ISSUE_LIMIT);
    }
  }
  // Nested seo.issues / seo.suggestions
  if (r.seo) {
    for (const key of ["issues", "suggestions"]) {
      if (Array.isArray(r.seo[key]) && r.seo[key].length > FREE_ISSUE_LIMIT) {
        hiddenCount += r.seo[key].length - FREE_ISSUE_LIMIT;
        r.seo[key] = r.seo[key].slice(0, FREE_ISSUE_LIMIT);
      }
    }
  }
  // Limit images detail
  if (r.images?.problematicImages && r.images.problematicImages.length > 3) {
    hiddenCount += r.images.problematicImages.length - 3;
    r.images.problematicImages = r.images.problematicImages.slice(0, 3);
  }
  if (r.images?.images && r.images.images.length > 5) {
    hiddenCount += r.images.images.length - 5;
    r.images.images = r.images.images.slice(0, 5);
  }
  // Limit broken links detail
  if (r.broken && r.broken.length > 3) {
    hiddenCount += r.broken.length - 3;
    r.broken = r.broken.slice(0, 3);
  }
  // Redact headings structure detail (keep counts only)
  if (r.headings?.structure) {
    const counts: Record<string, number> = {};
    for (const [level, items] of Object.entries(r.headings.structure)) {
      counts[level] = (items as string[]).length;
    }
    r.headings.structure = counts;
    r.headings._note = "Full heading text available in Pro Report";
  }
  // Nested seo headings
  if (r.seo?.headings) {
    const counts: Record<string, number> = {};
    for (const [level, items] of Object.entries(r.seo.headings)) {
      counts[level] = (items as string[]).length;
    }
    r.seo.headings = counts;
  }

  return { free: r, hiddenCount };
}

function withProTip(result: any): { content: Array<{ type: "text"; text: string }> } {
  const { free, hiddenCount } = applyFreemiumLimits(result);

  let proTip = "\n\n---\n🔒 FREE TIER";
  if (hiddenCount > 0) {
    proTip += ` — ${hiddenCount} additional findings hidden.`;
  }
  proTip += `\n📊 Unlock FULL report: all issues, detailed suggestions, heading analysis, and priority-ordered action plan.`;
  proTip += `\n👉 Pro Report (¥9.9 / ~$1.4): ${PRO_URL}`;

  return {
    content: [
      { type: "text", text: JSON.stringify(free, null, 2) + proTip },
    ],
  };
}

function generateComparison(a: any, b: any): Record<string, string> {
  const comp: Record<string, string> = {};
  if (a.performance && b.performance) {
    comp.faster = a.performance.responseTimeMs < b.performance.responseTimeMs
      ? a.url : b.url;
    comp.response_time_diff_ms = Math.abs(
      a.performance.responseTimeMs - b.performance.responseTimeMs
    ).toString();
  }
  if (a.seo?.score !== undefined && b.seo?.score !== undefined) {
    comp.better_seo = a.seo.score > b.seo.score ? a.url : b.url;
  }
  return comp;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
