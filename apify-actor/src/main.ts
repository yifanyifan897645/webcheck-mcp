/**
 * WebCheck Apify Actor — Website Health Analyzer
 *
 * Pay-per-event: charges per URL checked.
 * Reuses core modules from webcheck-mcp (zero external deps for analysis).
 */

import { Actor } from 'apify';

import { analyzeUrl } from './analyzer.js';
import { checkSeo } from './seo.js';
import { checkAccessibility } from './accessibility.js';
import { findBrokenLinks } from './links.js';

interface Input {
    urls: string[];
    checks?: string[];
    maxLinksPerPage?: number;
    reportFormat?: 'summary' | 'detailed';
}

await Actor.init();

const input = await Actor.getInput<Input>();

if (!input?.urls || input.urls.length === 0) {
    throw new Error('Input must include at least one URL in the "urls" field.');
}

const checks = input.checks ?? ['full', 'seo', 'accessibility', 'links'];
const maxLinks = input.maxLinksPerPage ?? 50;
const reportFormat = input.reportFormat ?? 'summary';

console.log(`WebCheck: analyzing ${input.urls.length} URL(s), checks: ${checks.join(', ')}, format: ${reportFormat}`);

for (const url of input.urls) {
    console.log(`Checking: ${url}`);

    try {
        const result: Record<string, unknown> = { url, timestamp: new Date().toISOString(), reportFormat };

        if (checks.includes('full')) {
            result.fullAnalysis = await analyzeUrl(url);
        }

        if (checks.includes('seo')) {
            result.seo = await checkSeo(url);
        }

        if (checks.includes('accessibility')) {
            result.accessibility = await checkAccessibility(url);
        }

        if (checks.includes('links')) {
            result.brokenLinks = await findBrokenLinks(url, maxLinks);
        }

        // In summary mode, strip detailed findings and keep only scores + top issues
        if (reportFormat === 'summary') {
            if (result.fullAnalysis && typeof result.fullAnalysis === 'object') {
                const full = result.fullAnalysis as Record<string, any>;
                result.fullAnalysis = {
                    performance: full.performance,
                    security: full.security,
                    seo: full.seo ? { score: full.seo.score, issues: (full.seo.issues || []).slice(0, 5) } : undefined,
                    images: full.images,
                };
            }
            if (result.seo && typeof result.seo === 'object') {
                const seo = result.seo as Record<string, any>;
                result.seo = {
                    score: seo.score,
                    priorities: (seo.priorities || []).slice(0, 5),
                    issues: (seo.issues || []).slice(0, 5),
                };
            }
            if (result.accessibility && typeof result.accessibility === 'object') {
                const a11y = result.accessibility as Record<string, any>;
                result.accessibility = {
                    score: a11y.score,
                    issues: (a11y.issues || []).slice(0, 5),
                };
            }
            if (result.brokenLinks && typeof result.brokenLinks === 'object') {
                const links = result.brokenLinks as Record<string, any>;
                result.brokenLinks = {
                    totalLinks: links.totalLinks,
                    checked: links.checked,
                    broken: (links.broken || []).slice(0, 10),
                    healthy: links.healthy,
                    summary: links.summary,
                };
            }
        }

        await Actor.pushData(result);

        // Charge per URL checked (pay-per-event)
        try {
            await (Actor as any).charge({ eventName: 'url-checked', count: 1 });
        } catch {
            // charge() may not be available in local/test mode
        }

        console.log(`Done: ${url}`);
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error checking ${url}: ${errMsg}`);
        await Actor.pushData({
            url,
            error: errMsg,
            timestamp: new Date().toISOString(),
        });
    }
}

await Actor.exit();
