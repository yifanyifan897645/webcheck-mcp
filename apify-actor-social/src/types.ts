/** Shared types for the TikTok Profile Analyzer */

export interface ProfileStats {
    username: string;
    nickname: string;
    bio: string;
    verified: boolean;
    privateAccount: boolean;
    followers: number;
    following: number;
    likes: number;
    videoCount: number;
    avatarUrl: string;
    profileUrl: string;
}

export interface VideoData {
    id: string;
    url: string;
    description: string;
    createTime: number; // unix timestamp
    createDate: string; // ISO string
    duration: number; // seconds
    stats: {
        views: number;
        likes: number;
        comments: number;
        shares: number;
        bookmarks: number;
    };
    music: {
        title: string;
        author: string;
    } | null;
    hashtags: string[];
    coverUrl: string;
}

export interface EngagementAnalysis {
    engagementRate: number; // percentage
    avgViewsPerVideo: number;
    avgLikesPerVideo: number;
    avgCommentsPerVideo: number;
    avgSharesPerVideo: number;
    avgBookmarksPerVideo: number;
    viewToFollowerRatio: number;
    likeToViewRatio: number;
    commentToViewRatio: number;
}

export interface PostingPatterns {
    totalVideosAnalyzed: number;
    dateRange: { from: string; to: string };
    videosPerWeek: number;
    avgDurationSeconds: number;
    mostActiveDay: string | null;
    postingGaps: { maxGapDays: number; avgGapDays: number };
}

export interface ContentThemes {
    topHashtags: Array<{ tag: string; count: number; avgViews: number }>;
    avgHashtagsPerVideo: number;
    topPerformingVideos: Array<{
        id: string;
        url: string;
        description: string;
        views: number;
        engagementRate: number;
    }>;
    underperformingVideos: Array<{
        id: string;
        url: string;
        description: string;
        views: number;
        engagementRate: number;
    }>;
}

export interface ProfileAnalysis {
    username: string;
    scrapedAt: string;
    profileStats: ProfileStats;
    engagement: EngagementAnalysis;
    postingPatterns: PostingPatterns;
    contentThemes: ContentThemes | null;
    videos: VideoData[];
    growthSignals: {
        accountAge: string | null;
        contentConsistency: 'high' | 'medium' | 'low';
        engagementTier: 'viral' | 'high' | 'good' | 'average' | 'low';
        audienceQuality: string;
    };
}

export interface VideoAnalysis {
    videoId: string;
    url: string;
    scrapedAt: string;
    video: VideoData;
    performance: {
        engagementRate: number;
        viralScore: number; // 0-100
        likeToViewRatio: number;
        commentToViewRatio: number;
        shareToViewRatio: number;
    };
}

export type AnalysisDepth = 'quick' | 'standard' | 'deep';

export interface ActorInput {
    profiles?: string[];
    videoUrls?: string[];
    analysisDepth?: AnalysisDepth;
    maxVideosPerProfile?: number;
    proxyConfig?: {
        useApifyProxy?: boolean;
        apifyProxyGroups?: string[];
        proxyUrls?: string[];
    };
}
