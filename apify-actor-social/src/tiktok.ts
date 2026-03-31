/**
 * TikTok data fetching and parsing.
 *
 * Strategy: fetch TikTok pages via HTTP and extract the embedded JSON data
 * that TikTok injects for SSR hydration. This avoids needing a browser.
 *
 * TikTok embeds data in a <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">
 * tag as JSON. We parse that to get profile info and video lists.
 *
 * If that fails, we fall back to parsing the SIGI_STATE or similar patterns.
 */

import * as cheerio from 'cheerio';
import type { ProfileStats, VideoData } from './types.js';

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

function randomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

interface FetchOptions {
    proxyUrl?: string;
}

/**
 * Fetch a TikTok page with appropriate headers.
 */
async function fetchPage(url: string, opts?: FetchOptions): Promise<string> {
    const headers: Record<string, string> = {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
    };

    // Retry with backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const fetchOpts: RequestInit & { agent?: unknown } = { headers, redirect: 'follow' };

            // If proxy URL provided, we need to use it via the global agent or a library.
            // Node 20 native fetch doesn't support proxies directly, so we rely on
            // Apify's proxy configuration being set at the environment level.
            const response = await fetch(url, fetchOpts);

            if (response.status === 403 || response.status === 429) {
                const wait = (attempt + 1) * 2000 + Math.random() * 1000;
                console.log(`TikTok returned ${response.status}, retrying in ${Math.round(wait)}ms...`);
                await new Promise(r => setTimeout(r, wait));
                lastError = new Error(`HTTP ${response.status}`);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.text();
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < 2) {
                const wait = (attempt + 1) * 1500;
                await new Promise(r => setTimeout(r, wait));
            }
        }
    }

    throw new Error(`Failed to fetch ${url} after 3 attempts: ${lastError?.message}`);
}

/**
 * Extract the universal hydration data from TikTok HTML.
 */
function extractHydrationData(html: string): Record<string, any> | null {
    const $ = cheerio.load(html);

    // Strategy 1: __UNIVERSAL_DATA_FOR_REHYDRATION__
    const universalScript = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__');
    if (universalScript.length) {
        try {
            return JSON.parse(universalScript.html() || '');
        } catch { /* try next */ }
    }

    // Strategy 2: SIGI_STATE (older format)
    const sigiScript = $('script#SIGI_STATE');
    if (sigiScript.length) {
        try {
            return JSON.parse(sigiScript.html() || '');
        } catch { /* try next */ }
    }

    // Strategy 3: search all script tags for JSON with user data
    const scripts = $('script');
    for (let i = 0; i < scripts.length; i++) {
        const text = $(scripts[i]).html() || '';
        // Look for script content that has typical TikTok data markers
        if (text.includes('"uniqueId"') && text.includes('"stats"')) {
            // Try to find JSON object in the script
            const jsonMatch = text.match(/\{[\s\S]*"uniqueId"[\s\S]*"stats"[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch { /* continue */ }
            }
        }
    }

    // Strategy 4: look for window.__data or similar globals
    const allScripts = $('script:not([src])');
    for (let i = 0; i < allScripts.length; i++) {
        const text = $(allScripts[i]).html() || '';
        const patterns = [
            /window\.__DATA__\s*=\s*(\{[\s\S]*?\});/,
            /window\.__INIT_PROPS__\s*=\s*(\{[\s\S]*?\});/,
            /"webapp\.user-detail":\s*(\{[\s\S]*?\})\s*[,}]/,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match?.[1]) {
                try {
                    return JSON.parse(match[1]);
                } catch { /* continue */ }
            }
        }
    }

    return null;
}

/**
 * Navigate the hydration data to find user info.
 * TikTok's data structure varies, so we try multiple paths.
 */
function findUserData(data: Record<string, any>): Record<string, any> | null {
    // Path 1: __DEFAULT_SCOPE__["webapp.user-detail"]
    const defaultScope = data?.['__DEFAULT_SCOPE__'];
    if (defaultScope) {
        const userDetail = defaultScope['webapp.user-detail'];
        if (userDetail?.userInfo) return userDetail.userInfo;
    }

    // Path 2: UserModule or UserPage
    if (data?.UserModule?.users) {
        const users = data.UserModule.users;
        const firstKey = Object.keys(users)[0];
        if (firstKey) return { user: users[firstKey], stats: data.UserModule.stats?.[firstKey] };
    }

    // Path 3: direct userInfo
    if (data?.userInfo) return data.userInfo;

    // Path 4: deep search for user object
    function deepFind(obj: any, depth = 0): any {
        if (depth > 5 || !obj || typeof obj !== 'object') return null;
        if (obj.uniqueId && obj.nickname && (obj.followerCount !== undefined || obj.stats)) {
            return obj.user ? obj : { user: obj, stats: obj.stats || obj };
        }
        for (const key of Object.keys(obj)) {
            const found = deepFind(obj[key], depth + 1);
            if (found) return found;
        }
        return null;
    }

    return deepFind(data);
}

/**
 * Navigate the hydration data to find video items.
 */
function findVideoItems(data: Record<string, any>): any[] {
    // Path 1: __DEFAULT_SCOPE__["webapp.user-detail"]
    const defaultScope = data?.['__DEFAULT_SCOPE__'];
    if (defaultScope) {
        const userDetail = defaultScope['webapp.user-detail'];
        if (userDetail?.itemList) return userDetail.itemList;
    }

    // Path 2: ItemModule
    if (data?.ItemModule) {
        return Object.values(data.ItemModule);
    }

    // Path 3: deep search for item list
    function deepFindItems(obj: any, depth = 0): any[] | null {
        if (depth > 4 || !obj || typeof obj !== 'object') return null;
        if (Array.isArray(obj) && obj.length > 0 && obj[0]?.desc !== undefined && obj[0]?.stats) {
            return obj;
        }
        for (const key of Object.keys(obj)) {
            if (key === 'itemList' || key === 'items' || key === 'videoList') {
                if (Array.isArray(obj[key]) && obj[key].length > 0) return obj[key];
            }
            const found = deepFindItems(obj[key], depth + 1);
            if (found) return found;
        }
        return null;
    }

    return deepFindItems(data) || [];
}

/**
 * Parse raw TikTok user data into our ProfileStats type.
 */
function parseProfileStats(userData: Record<string, any>, username: string): ProfileStats {
    const user = userData.user || userData;
    const stats = userData.stats || user.stats || user;

    return {
        username: user.uniqueId || username,
        nickname: user.nickname || '',
        bio: user.signature || '',
        verified: user.verified || false,
        privateAccount: user.privateAccount || user.secret || false,
        followers: stats.followerCount ?? stats.followers ?? 0,
        following: stats.followingCount ?? stats.following ?? 0,
        likes: stats.heartCount ?? stats.heart ?? stats.diggCount ?? stats.likes ?? 0,
        videoCount: stats.videoCount ?? stats.video ?? 0,
        avatarUrl: user.avatarLarger || user.avatarMedium || user.avatarThumb || '',
        profileUrl: `https://www.tiktok.com/@${user.uniqueId || username}`,
    };
}

/**
 * Parse a raw TikTok video item into our VideoData type.
 */
function parseVideoItem(item: Record<string, any>): VideoData {
    const stats = item.stats || item.statsV2 || {};
    const music = item.music;
    const hashtags: string[] = [];

    // Extract hashtags from textExtra or challenges
    if (item.textExtra) {
        for (const extra of item.textExtra) {
            if (extra.hashtagName) hashtags.push(extra.hashtagName);
        }
    }
    if (item.challenges) {
        for (const ch of item.challenges) {
            if (ch.title && !hashtags.includes(ch.title)) hashtags.push(ch.title);
        }
    }
    // Also extract from description
    const descHashtags = (item.desc || '').match(/#(\w+)/g);
    if (descHashtags) {
        for (const tag of descHashtags) {
            const clean = tag.slice(1);
            if (!hashtags.includes(clean)) hashtags.push(clean);
        }
    }

    const videoId = item.id || String(item.createTime || Math.random());
    const createTime = Number(item.createTime) || 0;

    return {
        id: videoId,
        url: `https://www.tiktok.com/@${item.author?.uniqueId || 'unknown'}/video/${videoId}`,
        description: item.desc || '',
        createTime,
        createDate: createTime ? new Date(createTime * 1000).toISOString() : '',
        duration: item.video?.duration || item.duration || 0,
        stats: {
            views: Number(stats.playCount ?? stats.plays ?? stats.views ?? 0),
            likes: Number(stats.diggCount ?? stats.likes ?? stats.heart ?? 0),
            comments: Number(stats.commentCount ?? stats.comments ?? 0),
            shares: Number(stats.shareCount ?? stats.shares ?? 0),
            bookmarks: Number(stats.collectCount ?? stats.bookmarks ?? stats.saves ?? 0),
        },
        music: music ? {
            title: music.title || '',
            author: music.authorName || music.author || '',
        } : null,
        hashtags,
        coverUrl: item.video?.cover || item.video?.originCover || '',
    };
}

/**
 * Fetch and parse a TikTok profile page.
 */
export async function fetchProfile(
    username: string,
    opts?: FetchOptions,
): Promise<{ stats: ProfileStats; videos: VideoData[] }> {
    // Clean the username
    const cleanUser = username.replace(/^@/, '').trim();
    const url = `https://www.tiktok.com/@${cleanUser}`;

    console.log(`Fetching profile: ${url}`);
    const html = await fetchPage(url, opts);

    const data = extractHydrationData(html);
    if (!data) {
        throw new Error(
            `Could not extract data from TikTok page for @${cleanUser}. ` +
            'The page structure may have changed or the profile may not exist. ' +
            'Try using a proxy if you are being rate-limited.'
        );
    }

    const userData = findUserData(data);
    if (!userData) {
        throw new Error(
            `Could not find user data for @${cleanUser} in the page. ` +
            'The account may be private, suspended, or the page structure changed.'
        );
    }

    const stats = parseProfileStats(userData, cleanUser);

    if (stats.privateAccount) {
        console.log(`@${cleanUser} is a private account — video data may be limited.`);
    }

    const rawVideos = findVideoItems(data);
    const videos = rawVideos.map(parseVideoItem);

    console.log(`Parsed @${cleanUser}: ${stats.followers} followers, ${videos.length} videos from page`);
    return { stats, videos };
}

/**
 * Fetch and parse a single TikTok video page.
 */
export async function fetchVideo(
    videoUrl: string,
    opts?: FetchOptions,
): Promise<VideoData> {
    console.log(`Fetching video: ${videoUrl}`);
    const html = await fetchPage(videoUrl, opts);

    const data = extractHydrationData(html);
    if (!data) {
        throw new Error(`Could not extract data from TikTok video page: ${videoUrl}`);
    }

    // Find the video item in the data
    const defaultScope = data?.['__DEFAULT_SCOPE__'];
    let itemData: any = null;

    if (defaultScope) {
        const videoDetail = defaultScope['webapp.video-detail'];
        if (videoDetail?.itemInfo?.itemStruct) {
            itemData = videoDetail.itemInfo.itemStruct;
        }
    }

    if (!itemData) {
        // Try ItemModule
        if (data?.ItemModule) {
            const items = Object.values(data.ItemModule);
            if (items.length > 0) itemData = items[0];
        }
    }

    if (!itemData) {
        // Deep search
        function deepFindVideo(obj: any, depth = 0): any {
            if (depth > 5 || !obj || typeof obj !== 'object') return null;
            if (obj.desc !== undefined && obj.stats && obj.id) return obj;
            for (const key of Object.keys(obj)) {
                const found = deepFindVideo(obj[key], depth + 1);
                if (found) return found;
            }
            return null;
        }
        itemData = deepFindVideo(data);
    }

    if (!itemData) {
        throw new Error(`Could not find video data in page: ${videoUrl}`);
    }

    return parseVideoItem(itemData);
}
