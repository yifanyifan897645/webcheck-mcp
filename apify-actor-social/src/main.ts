/**
 * TikTok Profile & Video Analyzer — Apify Actor
 *
 * Analyzes TikTok profiles and videos for engagement metrics,
 * posting patterns, and content performance insights.
 *
 * Pay-per-event: charges per profile or video analyzed.
 */

import { Actor } from 'apify';

import type { ActorInput, AnalysisDepth } from './types.js';
import { fetchProfile, fetchVideo } from './tiktok.js';
import { buildProfileAnalysis, buildVideoAnalysis } from './analyzer.js';

await Actor.init();

const input = await Actor.getInput<ActorInput>();

const profiles = input?.profiles ?? [];
const videoUrls = input?.videoUrls ?? [];
const depth: AnalysisDepth = input?.analysisDepth ?? 'standard';
const maxVideos = input?.maxVideosPerProfile ?? 30;

if (profiles.length === 0 && videoUrls.length === 0) {
    throw new Error(
        'Provide at least one TikTok username in "profiles" or one video URL in "videoUrls".',
    );
}

console.log(
    `TikTok Analyzer: ${profiles.length} profile(s), ${videoUrls.length} video(s), ` +
    `depth=${depth}, maxVideos=${maxVideos}`,
);

// --- Analyze profiles ---
for (const username of profiles) {
    const cleanUser = username.replace(/^@/, '').trim();
    if (!cleanUser) continue;

    console.log(`\n--- Analyzing profile: @${cleanUser} ---`);

    try {
        const { stats, videos } = await fetchProfile(cleanUser);

        // Limit videos to maxVideos
        const limitedVideos = videos.slice(0, maxVideos);

        const analysis = buildProfileAnalysis(stats, limitedVideos, depth);

        await Actor.pushData({
            type: 'profile_analysis',
            ...analysis,
        });

        // Charge per profile analyzed
        try {
            await (Actor as any).charge({ eventName: 'profile-analyzed', count: 1 });
        } catch {
            // charge() may not be available in local/test mode
        }

        console.log(
            `Done: @${cleanUser} — ` +
            `${stats.followers.toLocaleString()} followers, ` +
            `${analysis.engagement.engagementRate}% engagement, ` +
            `${analysis.growthSignals.engagementTier} tier`,
        );
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error analyzing @${cleanUser}: ${errMsg}`);
        await Actor.pushData({
            type: 'profile_analysis',
            username: cleanUser,
            error: errMsg,
            scrapedAt: new Date().toISOString(),
        });
    }

    // Small delay between profiles to avoid rate limiting
    if (profiles.indexOf(username) < profiles.length - 1) {
        const delay = 1000 + Math.random() * 2000;
        await new Promise(r => setTimeout(r, delay));
    }
}

// --- Analyze individual videos ---
for (const videoUrl of videoUrls) {
    if (!videoUrl.trim()) continue;

    console.log(`\n--- Analyzing video: ${videoUrl} ---`);

    try {
        const videoData = await fetchVideo(videoUrl);
        const analysis = buildVideoAnalysis(videoData);

        await Actor.pushData({
            type: 'video_analysis',
            ...analysis,
        });

        // Charge per video analyzed
        try {
            await (Actor as any).charge({ eventName: 'video-analyzed', count: 1 });
        } catch {
            // charge() may not be available in local/test mode
        }

        console.log(
            `Done: video ${videoData.id} — ` +
            `${videoData.stats.views.toLocaleString()} views, ` +
            `${analysis.performance.engagementRate}% engagement, ` +
            `viral score: ${analysis.performance.viralScore}/100`,
        );
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error analyzing video ${videoUrl}: ${errMsg}`);
        await Actor.pushData({
            type: 'video_analysis',
            url: videoUrl,
            error: errMsg,
            scrapedAt: new Date().toISOString(),
        });
    }

    // Small delay between videos
    if (videoUrls.indexOf(videoUrl) < videoUrls.length - 1) {
        const delay = 800 + Math.random() * 1500;
        await new Promise(r => setTimeout(r, delay));
    }
}

console.log('\nTikTok Analyzer: all tasks complete.');
await Actor.exit();
