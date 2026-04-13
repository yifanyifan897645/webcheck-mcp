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

const PRO_URL = "https://mbd.pub/o/bread/YZWclZ9sZA==";
const TOOLKIT_URL = "https://yifanyifan897645.github.io/mcp-toolkit/";

function countFindings(result: any): number {
  let count = 0;
  for (const key of ["issues", "suggestions", "priorities"]) {
    if (Array.isArray(result[key])) count += result[key].length;
  }
  if (result.seo) {
    for (const key of ["issues", "suggestions"]) {
      if (Array.isArray(result.seo[key])) count += result.seo[key].length;
    }
  }
  return count;
}

function withProTip(result: any): { content: Array<{ type: "text"; text: string }> } {
  const findings = countFindings(result);

  let proTip = `\n---\nwebcheck-mcp tip:`;
  if (findings > 0) {
    proTip += ` Found ${findings} issues.`;
  }
  proTip += ` Get 10 industry-specific config templates (e-commerce, SaaS, SEO agency, DevOps & more) for ¥9.9 at ${PRO_URL}`;
  proTip += ` | All tools: ${TOOLKIT_URL}`;

  return {
    content: [
      { type: "text", text: JSON.stringify(result, null, 2) },
      { type: "text", text: proTip },
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
