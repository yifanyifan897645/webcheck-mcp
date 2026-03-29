/**
 * Basic accessibility checks.
 */

import { fetchPage } from "./fetcher.js";
import { extractImages, extractHeadings } from "./html-parser.js";

export interface AccessibilityResult {
  url: string;
  score: number;
  images: {
    total: number;
    missingAlt: number;
    emptyAlt: number;
    decorativeImages: string[];
    problematicImages: Array<{ src: string; issue: string }>;
  };
  headings: {
    structure: Record<string, string[]>;
    skippedLevels: string[];
    isLogical: boolean;
  };
  forms: {
    inputsWithoutLabels: number;
    totalInputs: number;
  };
  aria: {
    landmarkRoles: string[];
    ariaLabelCount: number;
    hasSkipLink: boolean;
    hasMainLandmark: boolean;
  };
  language: {
    hasLangAttribute: boolean;
    langValue: string | null;
  };
  issues: string[];
  suggestions: string[];
}

export async function checkAccessibility(url: string): Promise<AccessibilityResult> {
  const page = await fetchPage(url);
  const { html } = page;

  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Images
  const images = extractImages(html);
  const missingAlt = images.filter((i) => i.alt === null);
  const emptyAlt = images.filter((i) => i.alt !== null && i.alt.trim() === "");
  const problematic = missingAlt.map((i) => ({ src: i.src, issue: "missing alt attribute" }));

  if (missingAlt.length > 0) {
    issues.push(`${missingAlt.length} image(s) have no alt attribute`);
    score -= Math.min(20, missingAlt.length * 3);
  }

  // Headings hierarchy
  const headings = extractHeadings(html);
  const levels = Object.keys(headings)
    .map((h) => parseInt(h.replace("h", "")))
    .sort();
  const skippedLevels: string[] = [];
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      skippedLevels.push(`h${levels[i - 1]} → h${levels[i]}`);
    }
  }
  if (levels.length > 0 && levels[0] !== 1) {
    skippedLevels.unshift(`starts at h${levels[0]} instead of h1`);
  }
  if (skippedLevels.length > 0) {
    issues.push(`Heading hierarchy skips levels: ${skippedLevels.join(", ")}`);
    score -= 5 * skippedLevels.length;
  }

  // Forms - check for inputs without associated labels
  const inputRegex = /<input[^>]+(?:type=["'](?:text|email|password|search|tel|url|number)["'])[^>]*>/gi;
  const inputs: string[] = [];
  let inputMatch;
  while ((inputMatch = inputRegex.exec(html)) !== null) {
    inputs.push(inputMatch[0]);
  }
  const inputsWithoutLabels = inputs.filter((input) => {
    const idMatch = input.match(/id=["']([^"']*)["']/i);
    if (!idMatch) return true;
    const labelRegex = new RegExp(`<label[^>]+for=["']${idMatch[1]}["']`, "i");
    return !labelRegex.test(html);
  }).length;

  if (inputsWithoutLabels > 0) {
    issues.push(`${inputsWithoutLabels} form input(s) may lack associated labels`);
    score -= Math.min(15, inputsWithoutLabels * 3);
  }

  // ARIA
  const landmarkRoles: string[] = [];
  const roleRegex = /role=["'](banner|navigation|main|complementary|contentinfo|search|form|region)["']/gi;
  let roleMatch;
  while ((roleMatch = roleRegex.exec(html)) !== null) {
    landmarkRoles.push(roleMatch[1]);
  }
  // Also check semantic elements
  if (/<main[\s>]/i.test(html)) landmarkRoles.push("main (semantic)");
  if (/<nav[\s>]/i.test(html)) landmarkRoles.push("navigation (semantic)");
  if (/<header[\s>]/i.test(html)) landmarkRoles.push("banner (semantic)");
  if (/<footer[\s>]/i.test(html)) landmarkRoles.push("contentinfo (semantic)");

  const ariaLabelCount = (html.match(/aria-label=/gi) || []).length;
  const hasSkipLink = /skip[- ]?(to[- ]?)?(main|content|navigation)/i.test(html);
  const hasMainLandmark =
    landmarkRoles.includes("main") || landmarkRoles.includes("main (semantic)");

  if (!hasMainLandmark) {
    issues.push("No main landmark found — add <main> or role=\"main\"");
    score -= 5;
  }
  if (!hasSkipLink) {
    suggestions.push("Add a 'skip to main content' link for keyboard navigation");
    score -= 3;
  }

  // Language
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  if (!langMatch) {
    issues.push("Missing lang attribute on <html> element");
    score -= 10;
  }

  score = Math.max(0, score);

  return {
    url: page.finalUrl,
    score,
    images: {
      total: images.length,
      missingAlt: missingAlt.length,
      emptyAlt: emptyAlt.length,
      decorativeImages: emptyAlt.map((i) => i.src),
      problematicImages: problematic.slice(0, 10),
    },
    headings: {
      structure: headings,
      skippedLevels,
      isLogical: skippedLevels.length === 0,
    },
    forms: {
      inputsWithoutLabels,
      totalInputs: inputs.length,
    },
    aria: {
      landmarkRoles: [...new Set(landmarkRoles)],
      ariaLabelCount,
      hasSkipLink,
      hasMainLandmark,
    },
    language: {
      hasLangAttribute: !!langMatch,
      langValue: langMatch ? langMatch[1] : null,
    },
    issues,
    suggestions,
  };
}
