/**
 * Broken link finder — checks all links on a page.
 */

import { fetchPage, checkUrl } from "./fetcher.js";
import { extractLinks } from "./html-parser.js";

export interface BrokenLinksResult {
  url: string;
  totalLinks: number;
  checked: number;
  broken: Array<{ url: string; status: number; error?: string }>;
  redirects: Array<{ url: string; redirectsTo: string }>;
  healthy: number;
  summary: string;
}

export async function findBrokenLinks(
  url: string,
  maxLinks = 50
): Promise<BrokenLinksResult> {
  const page = await fetchPage(url);
  const allLinks = extractLinks(page.html, page.finalUrl);

  // Deduplicate and limit
  const uniqueLinks = [...new Set(allLinks)].slice(0, maxLinks);

  const broken: Array<{ url: string; status: number; error?: string }> = [];
  const redirects: Array<{ url: string; redirectsTo: string }> = [];
  let healthy = 0;

  // Check links in parallel batches of 10
  const batchSize = 10;
  for (let i = 0; i < uniqueLinks.length; i += batchSize) {
    const batch = uniqueLinks.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (link) => {
        const result = await checkUrl(link);
        return { link, ...result };
      })
    );

    for (const r of results) {
      if (!r.ok) {
        broken.push({ url: r.link, status: r.status, error: r.error });
      } else if (r.redirectUrl) {
        redirects.push({ url: r.link, redirectsTo: r.redirectUrl });
        healthy++;
      } else {
        healthy++;
      }
    }
  }

  const summary =
    broken.length === 0
      ? `All ${uniqueLinks.length} links are healthy.`
      : `Found ${broken.length} broken link(s) out of ${uniqueLinks.length} checked.`;

  return {
    url: page.finalUrl,
    totalLinks: allLinks.length,
    checked: uniqueLinks.length,
    broken,
    redirects: redirects.slice(0, 20),
    healthy,
    summary,
  };
}
