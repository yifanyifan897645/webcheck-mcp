/**
 * Full website health analysis.
 */

import { fetchPage } from "./fetcher.js";
import {
  extractTitle,
  extractMetaTag,
  extractHeadings,
  extractImages,
  extractOpenGraph,
  countWords,
  hasViewportMeta,
  hasCanonical,
  hasStructuredData,
} from "./html-parser.js";

export interface AnalysisResult {
  url: string;
  timestamp: string;
  performance: {
    responseTimeMs: number;
    contentLengthBytes: number;
    rating: string;
  };
  security: {
    isHttps: boolean;
    hasHsts: boolean;
    hasContentSecurityPolicy: boolean;
    hasXFrameOptions: boolean;
  };
  seo: {
    score: number;
    title: string | null;
    titleLength: number;
    metaDescription: string | null;
    metaDescriptionLength: number;
    hasViewport: boolean;
    hasCanonical: boolean;
    canonicalUrl: string | null;
    hasStructuredData: boolean;
    openGraph: Record<string, string>;
    headings: Record<string, string[]>;
    wordCount: number;
    issues: string[];
    suggestions: string[];
  };
  images: {
    total: number;
    missingAlt: number;
    images: Array<{ src: string; alt: string | null }>;
  };
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const page = await fetchPage(url);
  const { html, headers } = page;

  // Performance
  const perfRating =
    page.responseTimeMs < 500
      ? "fast"
      : page.responseTimeMs < 2000
        ? "moderate"
        : "slow";

  // Security headers
  const security = {
    isHttps: page.isHttps,
    hasHsts: !!headers["strict-transport-security"],
    hasContentSecurityPolicy: !!headers["content-security-policy"],
    hasXFrameOptions: !!headers["x-frame-options"],
  };

  // SEO
  const title = extractTitle(html);
  const metaDesc = extractMetaTag(html, "description");
  const viewport = hasViewportMeta(html);
  const canonical = hasCanonical(html);
  const structured = hasStructuredData(html);
  const og = extractOpenGraph(html);
  const headings = extractHeadings(html);
  const wordCount = countWords(html);

  const issues: string[] = [];
  const suggestions: string[] = [];
  let seoScore = 100;

  // Title checks
  if (!title) {
    issues.push("Missing page title");
    seoScore -= 20;
  } else if (title.length < 30) {
    issues.push(`Title too short (${title.length} chars, recommend 50-60)`);
    seoScore -= 5;
  } else if (title.length > 60) {
    issues.push(`Title too long (${title.length} chars, recommend 50-60)`);
    seoScore -= 5;
  }

  // Meta description checks
  if (!metaDesc) {
    issues.push("Missing meta description");
    seoScore -= 15;
  } else if (metaDesc.length < 120) {
    issues.push(`Meta description too short (${metaDesc.length} chars, recommend 150-160)`);
    seoScore -= 5;
  } else if (metaDesc.length > 160) {
    issues.push(`Meta description too long (${metaDesc.length} chars, recommend 150-160)`);
    seoScore -= 3;
  }

  // Heading checks
  if (!headings.h1 || headings.h1.length === 0) {
    issues.push("Missing H1 heading");
    seoScore -= 10;
  } else if (headings.h1.length > 1) {
    issues.push(`Multiple H1 headings (${headings.h1.length}) — recommend only 1`);
    seoScore -= 5;
  }

  // Content check
  if (wordCount < 300) {
    issues.push(`Low word count (${wordCount}) — thin content may rank poorly`);
    seoScore -= 10;
  }

  // Technical checks
  if (!viewport) {
    issues.push("Missing viewport meta tag — not mobile-friendly");
    seoScore -= 10;
  }
  if (!canonical) {
    suggestions.push("Add a canonical URL to prevent duplicate content issues");
    seoScore -= 3;
  }
  if (!structured) {
    suggestions.push("Add structured data (JSON-LD) for rich search results");
    seoScore -= 3;
  }
  if (!page.isHttps) {
    issues.push("Not using HTTPS — security and SEO penalty");
    seoScore -= 10;
  }
  if (!og["og:title"]) {
    suggestions.push("Add Open Graph tags for better social media sharing");
    seoScore -= 2;
  }

  // Performance suggestions
  if (page.responseTimeMs > 2000) {
    suggestions.push("Page load time is slow — consider optimizing");
  }

  seoScore = Math.max(0, Math.min(100, seoScore));

  // Images
  const images = extractImages(html);
  const missingAlt = images.filter((img) => !img.alt || img.alt.trim() === "").length;
  if (missingAlt > 0) {
    issues.push(`${missingAlt} image(s) missing alt text`);
    seoScore -= Math.min(10, missingAlt * 2);
  }

  seoScore = Math.max(0, seoScore);

  return {
    url: page.finalUrl,
    timestamp: new Date().toISOString(),
    performance: {
      responseTimeMs: page.responseTimeMs,
      contentLengthBytes: page.contentLength,
      rating: perfRating,
    },
    security,
    seo: {
      score: seoScore,
      title,
      titleLength: title?.length || 0,
      metaDescription: metaDesc,
      metaDescriptionLength: metaDesc?.length || 0,
      hasViewport: viewport,
      hasCanonical: !!canonical,
      canonicalUrl: canonical,
      hasStructuredData: structured,
      openGraph: og,
      headings,
      wordCount,
      issues,
      suggestions,
    },
    images: {
      total: images.length,
      missingAlt,
      images: images.slice(0, 20), // limit output
    },
  };
}
