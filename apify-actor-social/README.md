# TikTok Profile & Video Analyzer

Analyze any public TikTok profile or video in seconds. Get engagement rates, posting patterns, content performance insights, and growth signals — all as structured JSON.

**Built for marketers, agencies, and influencer platforms** who need data-driven TikTok analytics without manual work.

## What it does

### Profile Analysis
- **Profile stats**: followers, following, likes, video count, verification status
- **Engagement metrics**: engagement rate, avg views/likes/comments per video, view-to-follower ratio
- **Posting patterns**: posting frequency, most active day, content gaps, average video duration
- **Content themes**: top hashtags with performance data, best and worst performing videos
- **Growth signals**: engagement tier classification, audience quality assessment, content consistency score

### Video Analysis
- **Performance metrics**: views, likes, comments, shares, bookmarks
- **Engagement rate**: calculated from all interaction types
- **Viral score**: 0-100 composite score based on like, share, and comment ratios
- **Metadata**: hashtags, music, duration, posting date

## Use Cases

- **Influencer vetting**: Check engagement quality before signing partnerships
- **Competitor analysis**: Track competitor accounts and their content performance
- **Content strategy**: Identify what content types and hashtags perform best
- **Agency reporting**: Automated data collection for client dashboards
- **Market research**: Understand engagement benchmarks in specific niches

## Input

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `profiles` | string[] | TikTok usernames (without @) | — |
| `videoUrls` | string[] | TikTok video URLs | — |
| `analysisDepth` | string | `quick`, `standard`, or `deep` | `standard` |
| `maxVideosPerProfile` | number | Max recent videos to analyze per profile (5-100) | 30 |
| `proxyConfig` | object | Proxy settings (recommended for reliability) | — |

### Analysis Depth Levels

- **Quick**: Profile stats + top engagement metrics only. Fastest.
- **Standard**: Stats + recent video analysis + engagement breakdown + posting patterns.
- **Deep**: Full analysis including content themes, all video data in output, and detailed hashtag performance.

### Example Input

```json
{
    "profiles": ["charlidamelio", "khaby.lame"],
    "analysisDepth": "standard",
    "maxVideosPerProfile": 30
}
```

## Output

Each profile produces a structured JSON object:

```json
{
    "type": "profile_analysis",
    "username": "example",
    "scrapedAt": "2026-03-31T12:00:00.000Z",
    "profileStats": {
        "username": "example",
        "nickname": "Example Creator",
        "bio": "Content creator",
        "verified": true,
        "followers": 150000,
        "following": 500,
        "likes": 2500000,
        "videoCount": 320
    },
    "engagement": {
        "engagementRate": 4.2,
        "avgViewsPerVideo": 45000,
        "avgLikesPerVideo": 6300,
        "avgCommentsPerVideo": 180,
        "avgSharesPerVideo": 420,
        "avgBookmarksPerVideo": 95,
        "viewToFollowerRatio": 0.3,
        "likeToViewRatio": 0.14,
        "commentToViewRatio": 0.004
    },
    "postingPatterns": {
        "totalVideosAnalyzed": 30,
        "dateRange": { "from": "2026-01-01T...", "to": "2026-03-30T..." },
        "videosPerWeek": 5.2,
        "avgDurationSeconds": 32,
        "mostActiveDay": "Wednesday",
        "postingGaps": { "maxGapDays": 3.2, "avgGapDays": 1.3 }
    },
    "contentThemes": {
        "topHashtags": [
            { "tag": "fyp", "count": 18, "avgViews": 52000 },
            { "tag": "viral", "count": 12, "avgViews": 61000 }
        ],
        "topPerformingVideos": [...],
        "underperformingVideos": [...]
    },
    "growthSignals": {
        "contentConsistency": "high",
        "engagementTier": "good",
        "audienceQuality": "Good — healthy view-to-follower ratio"
    }
}
```

## Pricing

Pay-per-event pricing:
- **$0.005** per profile analyzed
- **$0.003** per video analyzed

No monthly fees. You only pay for what you use.

## Tips

- **Use proxies** for reliable results. TikTok may rate-limit direct requests. Apify residential proxies work best.
- **Start with `standard` depth** — it gives the best balance of speed and insight.
- **Batch profiles** in a single run to save on platform overhead.
- For ongoing monitoring, schedule this Actor to run daily/weekly with the same profile list.

## Technical Details

- Pure HTTP fetching — no browser automation needed, keeping costs low
- Parses TikTok's server-side rendered data (no API key required)
- Handles rate limiting with automatic retries and backoff
- Works with public profiles only (private accounts will return limited data)
- Built with TypeScript for reliability

## Limitations

- Only public profiles can be analyzed
- Video data is limited to what TikTok renders on the profile page (typically the most recent ~30 videos)
- TikTok may change their page structure; the Actor handles multiple data format versions
- Very high-volume use may require residential proxies
