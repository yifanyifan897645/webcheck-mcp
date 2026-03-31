/**
 * Engagement analysis and content insights engine.
 *
 * Takes raw profile stats and video data, produces actionable analytics.
 */

import type {
    ProfileStats,
    VideoData,
    EngagementAnalysis,
    PostingPatterns,
    ContentThemes,
    ProfileAnalysis,
    VideoAnalysis,
    AnalysisDepth,
} from './types.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Calculate average of an array of numbers. */
function avg(nums: number[]): number {
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Calculate median of an array of numbers. */
function median(nums: number[]): number {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute engagement metrics from video data.
 */
export function analyzeEngagement(
    profile: ProfileStats,
    videos: VideoData[],
): EngagementAnalysis {
    if (videos.length === 0) {
        return {
            engagementRate: 0,
            avgViewsPerVideo: 0,
            avgLikesPerVideo: 0,
            avgCommentsPerVideo: 0,
            avgSharesPerVideo: 0,
            avgBookmarksPerVideo: 0,
            viewToFollowerRatio: 0,
            likeToViewRatio: 0,
            commentToViewRatio: 0,
        };
    }

    const views = videos.map(v => v.stats.views);
    const likes = videos.map(v => v.stats.likes);
    const comments = videos.map(v => v.stats.comments);
    const shares = videos.map(v => v.stats.shares);
    const bookmarks = videos.map(v => v.stats.bookmarks);

    const avgViews = avg(views);
    const avgLikes = avg(likes);
    const avgComments = avg(comments);
    const avgShares = avg(shares);

    // Engagement rate = (likes + comments + shares) / views * 100
    // Using median views to reduce outlier impact
    const totalEngagement = videos.reduce(
        (sum, v) => sum + v.stats.likes + v.stats.comments + v.stats.shares,
        0,
    );
    const totalViews = videos.reduce((sum, v) => sum + v.stats.views, 0);
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    return {
        engagementRate: round(engagementRate, 2),
        avgViewsPerVideo: Math.round(avgViews),
        avgLikesPerVideo: Math.round(avgLikes),
        avgCommentsPerVideo: Math.round(avgComments),
        avgSharesPerVideo: Math.round(avgShares),
        avgBookmarksPerVideo: Math.round(avg(bookmarks)),
        viewToFollowerRatio: profile.followers > 0
            ? round(avgViews / profile.followers, 4)
            : 0,
        likeToViewRatio: avgViews > 0 ? round(avgLikes / avgViews, 4) : 0,
        commentToViewRatio: avgViews > 0 ? round(avgComments / avgViews, 4) : 0,
    };
}

/**
 * Analyze posting patterns from video timestamps.
 */
export function analyzePostingPatterns(videos: VideoData[]): PostingPatterns {
    if (videos.length === 0) {
        return {
            totalVideosAnalyzed: 0,
            dateRange: { from: '', to: '' },
            videosPerWeek: 0,
            avgDurationSeconds: 0,
            mostActiveDay: null,
            postingGaps: { maxGapDays: 0, avgGapDays: 0 },
        };
    }

    // Sort by creation time
    const sorted = [...videos]
        .filter(v => v.createTime > 0)
        .sort((a, b) => a.createTime - b.createTime);

    if (sorted.length === 0) {
        return {
            totalVideosAnalyzed: videos.length,
            dateRange: { from: '', to: '' },
            videosPerWeek: 0,
            avgDurationSeconds: Math.round(avg(videos.map(v => v.duration))),
            mostActiveDay: null,
            postingGaps: { maxGapDays: 0, avgGapDays: 0 },
        };
    }

    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    const spanDays = (newest.createTime - oldest.createTime) / 86400;
    const spanWeeks = Math.max(spanDays / 7, 1);

    // Day of week distribution
    const dayCount = new Array(7).fill(0);
    for (const v of sorted) {
        const day = new Date(v.createTime * 1000).getDay();
        dayCount[day]++;
    }
    const maxDayCount = Math.max(...dayCount);
    const mostActiveDay = maxDayCount > 0
        ? DAY_NAMES[dayCount.indexOf(maxDayCount)]
        : null;

    // Posting gaps
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
        gaps.push((sorted[i].createTime - sorted[i - 1].createTime) / 86400);
    }

    return {
        totalVideosAnalyzed: videos.length,
        dateRange: {
            from: oldest.createDate || new Date(oldest.createTime * 1000).toISOString(),
            to: newest.createDate || new Date(newest.createTime * 1000).toISOString(),
        },
        videosPerWeek: round(sorted.length / spanWeeks, 1),
        avgDurationSeconds: Math.round(avg(videos.map(v => v.duration))),
        mostActiveDay,
        postingGaps: {
            maxGapDays: gaps.length > 0 ? round(Math.max(...gaps), 1) : 0,
            avgGapDays: gaps.length > 0 ? round(avg(gaps), 1) : 0,
        },
    };
}

/**
 * Analyze content themes: hashtags, top/bottom performers.
 */
export function analyzeContentThemes(
    videos: VideoData[],
    profile: ProfileStats,
): ContentThemes {
    // Hashtag analysis
    const hashtagMap = new Map<string, { count: number; totalViews: number }>();
    for (const v of videos) {
        for (const tag of v.hashtags) {
            const lower = tag.toLowerCase();
            const existing = hashtagMap.get(lower) || { count: 0, totalViews: 0 };
            existing.count++;
            existing.totalViews += v.stats.views;
            hashtagMap.set(lower, existing);
        }
    }

    const topHashtags = [...hashtagMap.entries()]
        .map(([tag, data]) => ({
            tag,
            count: data.count,
            avgViews: Math.round(data.totalViews / data.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

    // Per-video engagement rate for ranking
    const withEngagement = videos.map(v => {
        const totalEng = v.stats.likes + v.stats.comments + v.stats.shares;
        const er = v.stats.views > 0 ? (totalEng / v.stats.views) * 100 : 0;
        return { ...v, engagementRate: round(er, 2) };
    });

    // Sort by views for top/bottom
    const byViews = [...withEngagement].sort((a, b) => b.stats.views - a.stats.views);

    const topPerforming = byViews.slice(0, 5).map(v => ({
        id: v.id,
        url: v.url,
        description: v.description.slice(0, 200),
        views: v.stats.views,
        engagementRate: v.engagementRate,
    }));

    const underperforming = byViews.slice(-5).reverse().map(v => ({
        id: v.id,
        url: v.url,
        description: v.description.slice(0, 200),
        views: v.stats.views,
        engagementRate: v.engagementRate,
    }));

    return {
        topHashtags,
        avgHashtagsPerVideo: round(avg(videos.map(v => v.hashtags.length)), 1),
        topPerformingVideos: topPerforming,
        underperformingVideos: underperforming,
    };
}

/**
 * Classify engagement tier based on rate.
 */
function classifyEngagement(rate: number): 'viral' | 'high' | 'good' | 'average' | 'low' {
    if (rate >= 10) return 'viral';
    if (rate >= 5) return 'high';
    if (rate >= 3) return 'good';
    if (rate >= 1) return 'average';
    return 'low';
}

/**
 * Assess content consistency from posting gaps.
 */
function assessConsistency(patterns: PostingPatterns): 'high' | 'medium' | 'low' {
    if (patterns.videosPerWeek >= 5 && patterns.postingGaps.maxGapDays <= 3) return 'high';
    if (patterns.videosPerWeek >= 2 && patterns.postingGaps.maxGapDays <= 10) return 'medium';
    return 'low';
}

/**
 * Produce a full profile analysis.
 */
export function buildProfileAnalysis(
    profile: ProfileStats,
    videos: VideoData[],
    depth: AnalysisDepth,
): ProfileAnalysis {
    const engagement = analyzeEngagement(profile, videos);
    const postingPatterns = analyzePostingPatterns(videos);
    const contentThemes = depth !== 'quick' ? analyzeContentThemes(videos, profile) : null;

    // Audience quality heuristic based on view-to-follower ratio
    let audienceQuality: string;
    if (engagement.viewToFollowerRatio >= 0.3) {
        audienceQuality = 'Excellent — high view-to-follower ratio suggests genuine, active audience';
    } else if (engagement.viewToFollowerRatio >= 0.1) {
        audienceQuality = 'Good — healthy view-to-follower ratio';
    } else if (engagement.viewToFollowerRatio >= 0.03) {
        audienceQuality = 'Average — moderate view-to-follower ratio, some inactive followers';
    } else {
        audienceQuality = 'Below average — low view-to-follower ratio, possible inactive or purchased followers';
    }

    return {
        username: profile.username,
        scrapedAt: new Date().toISOString(),
        profileStats: profile,
        engagement,
        postingPatterns,
        contentThemes,
        videos: depth === 'deep' ? videos : [],
        growthSignals: {
            accountAge: null, // TikTok doesn't expose account creation date
            contentConsistency: assessConsistency(postingPatterns),
            engagementTier: classifyEngagement(engagement.engagementRate),
            audienceQuality,
        },
    };
}

/**
 * Analyze a single video.
 */
export function buildVideoAnalysis(video: VideoData): VideoAnalysis {
    const totalEng = video.stats.likes + video.stats.comments + video.stats.shares;
    const engagementRate = video.stats.views > 0 ? (totalEng / video.stats.views) * 100 : 0;

    // Viral score: 0-100 based on engagement metrics
    // High like-to-view + high share-to-view = viral
    const likeRatio = video.stats.views > 0 ? video.stats.likes / video.stats.views : 0;
    const shareRatio = video.stats.views > 0 ? video.stats.shares / video.stats.views : 0;
    const commentRatio = video.stats.views > 0 ? video.stats.comments / video.stats.views : 0;

    // Weighted viral score
    const rawViral = (likeRatio * 40) + (shareRatio * 35) + (commentRatio * 25);
    // Normalize: a 10% like ratio with 5% share ratio would be very viral
    const viralScore = Math.min(100, Math.round(rawViral * 500));

    return {
        videoId: video.id,
        url: video.url,
        scrapedAt: new Date().toISOString(),
        video,
        performance: {
            engagementRate: round(engagementRate, 2),
            viralScore,
            likeToViewRatio: round(likeRatio, 4),
            commentToViewRatio: round(commentRatio, 4),
            shareToViewRatio: round(shareRatio, 4),
        },
    };
}

function round(n: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
}
