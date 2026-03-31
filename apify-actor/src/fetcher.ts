/**
 * Shared HTTP fetcher with timeout and error handling.
 * Uses only Node.js built-in fetch (no external deps).
 */

export interface FetchResult {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  responseTimeMs: number;
  finalUrl: string;
  contentLength: number;
  isHttps: boolean;
}

export async function fetchPage(url: string, timeoutMs = 15000): Promise<FetchResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "WebCheck-MCP/0.1 (https://github.com/anthropic-agents/webcheck-mcp)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
    });

    const html = await response.text();
    const elapsed = Date.now() - start;

    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      headers[k] = v;
    });

    return {
      html,
      statusCode: response.status,
      headers,
      responseTimeMs: elapsed,
      finalUrl: response.url,
      contentLength: html.length,
      isHttps: new URL(response.url).protocol === "https:",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkUrl(
  url: string,
  timeoutMs = 10000
): Promise<{ status: number; ok: boolean; redirectUrl?: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "WebCheck-MCP/0.1",
      },
    });
    clearTimeout(timer);

    return {
      status: response.status,
      ok: response.ok,
      redirectUrl: response.redirected ? response.url : undefined,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      status: 0,
      ok: false,
      error: err.name === "AbortError" ? "timeout" : err.message,
    };
  }
}
