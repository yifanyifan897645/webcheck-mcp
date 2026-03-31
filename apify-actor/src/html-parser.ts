/**
 * Lightweight HTML parser using regex.
 * No external dependencies — works with raw HTML strings.
 */

export function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : null;
}

export function extractMetaTag(html: string, name: string): string | null {
  // Try name attribute
  const nameRegex = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escapeRegex(name)}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  let match = html.match(nameRegex);
  if (match) return decodeEntities(match[1]);

  // Try reversed order (content before name)
  const reversedRegex = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escapeRegex(name)}["']`,
    "i"
  );
  match = html.match(reversedRegex);
  return match ? decodeEntities(match[1]) : null;
}

export function extractHeadings(html: string): Record<string, string[]> {
  const headings: Record<string, string[]> = {};
  for (let level = 1; level <= 6; level++) {
    const tag = `h${level}`;
    const regex = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, "gi");
    const matches: string[] = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
      matches.push(stripTags(decodeEntities(m[1].trim())));
    }
    if (matches.length > 0) {
      headings[tag] = matches;
    }
  }
  return headings;
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const regex = /href=["']([^"'#][^"']*)["']/gi;
  const links: Set<string> = new Set();
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const resolved = new URL(match[1], baseUrl).href;
      links.add(resolved);
    } catch {
      // skip invalid URLs
    }
  }
  return [...links];
}

export function extractImages(html: string): Array<{ src: string; alt: string | null }> {
  const regex = /<img[^>]*>/gi;
  const images: Array<{ src: string; alt: string | null }> = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/src=["']([^"']*)["']/i);
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (srcMatch) {
      images.push({
        src: srcMatch[1],
        alt: altMatch ? altMatch[1] : null,
      });
    }
  }
  return images;
}

export function extractOpenGraph(html: string): Record<string, string> {
  const og: Record<string, string> = {};
  const regex = /<meta[^>]+property=["'](og:[^"']*)["'][^>]+content=["']([^"']*)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    og[match[1]] = decodeEntities(match[2]);
  }
  // reversed order
  const regex2 = /<meta[^>]+content=["']([^"']*)["'][^>]+property=["'](og:[^"']*)["']/gi;
  while ((match = regex2.exec(html)) !== null) {
    if (!og[match[2]]) {
      og[match[2]] = decodeEntities(match[1]);
    }
  }
  return og;
}

export function countWords(html: string): number {
  const text = stripTags(html)
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  // Count both CJK characters and space-separated words
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
  const words = text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (cjk?.length || 0) + words.length;
}

export function hasViewportMeta(html: string): boolean {
  return /<meta[^>]+name=["']viewport["']/i.test(html);
}

export function hasCanonical(html: string): string | null {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  if (match) return match[1];
  const match2 = html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  return match2 ? match2[1] : null;
}

export function hasStructuredData(html: string): boolean {
  return /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
}

// ── Helpers ──

function stripTags(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ");
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
