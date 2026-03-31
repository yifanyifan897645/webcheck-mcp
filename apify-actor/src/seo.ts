/**
 * Detailed SEO analysis — deeper than the general analyzer.
 */

import { fetchPage } from "./fetcher.js";
import {
  extractTitle,
  extractMetaTag,
  extractHeadings,
  extractOpenGraph,
  countWords,
  hasViewportMeta,
  hasCanonical,
  hasStructuredData,
} from "./html-parser.js";

export interface SeoResult {
  url: string;
  score: number;
  title: { value: string | null; length: number; status: string };
  metaDescription: { value: string | null; length: number; status: string };
  headings: {
    structure: Record<string, string[]>;
    hasH1: boolean;
    h1Count: number;
    hierarchyValid: boolean;
  };
  content: {
    wordCount: number;
    status: string;
  };
  technical: {
    viewport: boolean;
    canonical: string | null;
    structuredData: boolean;
    robotsMeta: string | null;
    language: string | null;
  };
  social: {
    openGraph: Record<string, string>;
    twitterCard: string | null;
    hasOgImage: boolean;
  };
  issues: string[];
  priorities: string[];
}

export async function checkSeo(url: string): Promise<SeoResult> {
  const page = await fetchPage(url);
  const { html } = page;

  const title = extractTitle(html);
  const metaDesc = extractMetaTag(html, "description");
  const headings = extractHeadings(html);
  const og = extractOpenGraph(html);
  const wordCount = countWords(html);
  const canonical = hasCanonical(html);
  const robotsMeta = extractMetaTag(html, "robots");
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  const twitterCard = extractMetaTag(html, "twitter:card");

  let score = 100;
  const issues: string[] = [];
  const priorities: string[] = [];

  // Title
  let titleStatus = "good";
  if (!title) {
    titleStatus = "missing";
    score -= 20;
    priorities.push("HIGH: Add a page title (50-60 characters)");
  } else if (title.length < 30) {
    titleStatus = "too_short";
    score -= 5;
    issues.push("Title is shorter than recommended (aim for 50-60 chars)");
  } else if (title.length > 60) {
    titleStatus = "too_long";
    score -= 5;
    issues.push("Title may be truncated in search results (over 60 chars)");
  }

  // Meta Description
  let descStatus = "good";
  if (!metaDesc) {
    descStatus = "missing";
    score -= 15;
    priorities.push("HIGH: Add a meta description (150-160 characters)");
  } else if (metaDesc.length < 120) {
    descStatus = "too_short";
    score -= 5;
    issues.push("Meta description could be longer for better click-through");
  } else if (metaDesc.length > 160) {
    descStatus = "too_long";
    score -= 3;
    issues.push("Meta description may be truncated (over 160 chars)");
  }

  // Headings
  const h1Count = headings.h1?.length || 0;
  const hasH1 = h1Count > 0;
  if (!hasH1) {
    score -= 10;
    priorities.push("MEDIUM: Add an H1 heading");
  }
  if (h1Count > 1) {
    score -= 5;
    issues.push("Multiple H1 tags — use only one per page");
  }
  // Check hierarchy: h2 should exist if there's substantial content
  const hierarchyValid = hasH1 && (wordCount < 500 || !!headings.h2);
  if (!hierarchyValid && wordCount >= 500) {
    issues.push("Consider using H2 subheadings to structure longer content");
  }

  // Content
  let contentStatus = "good";
  if (wordCount < 100) {
    contentStatus = "very_thin";
    score -= 15;
    priorities.push("HIGH: Add more content — very thin page");
  } else if (wordCount < 300) {
    contentStatus = "thin";
    score -= 10;
    issues.push("Content is thin — aim for 300+ words for better ranking");
  } else if (wordCount > 3000) {
    contentStatus = "comprehensive";
  }

  // Technical
  if (!hasViewportMeta(html)) {
    score -= 10;
    priorities.push("HIGH: Add viewport meta tag for mobile compatibility");
  }
  if (!canonical) {
    score -= 3;
    issues.push("No canonical URL set");
  }
  if (!hasStructuredData(html)) {
    score -= 3;
    issues.push("No structured data (JSON-LD) found");
  }
  if (!langMatch) {
    score -= 2;
    issues.push("No language attribute on <html> tag");
  }

  // Social
  if (!og["og:title"]) {
    score -= 2;
    issues.push("Missing og:title — social shares won't display well");
  }
  if (!og["og:image"]) {
    score -= 2;
    issues.push("Missing og:image — social shares won't have a preview image");
  }

  if (!page.isHttps) {
    score -= 10;
    priorities.push("CRITICAL: Switch to HTTPS");
  }

  score = Math.max(0, score);

  return {
    url: page.finalUrl,
    score,
    title: { value: title, length: title?.length || 0, status: titleStatus },
    metaDescription: { value: metaDesc, length: metaDesc?.length || 0, status: descStatus },
    headings: { structure: headings, hasH1, h1Count, hierarchyValid },
    content: { wordCount, status: contentStatus },
    technical: {
      viewport: hasViewportMeta(html),
      canonical,
      structuredData: hasStructuredData(html),
      robotsMeta,
      language: langMatch ? langMatch[1] : null,
    },
    social: {
      openGraph: og,
      twitterCard,
      hasOgImage: !!og["og:image"],
    },
    issues,
    priorities,
  };
}
