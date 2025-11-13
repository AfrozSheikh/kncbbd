// src/routes/youtubeRoutes.js  (ESM)
import express from 'express';

const router = express.Router();
const API_KEY = process.env.YT_API_KEY;
const DEFAULT_CHANNEL_ID = process.env.YT_CHANNEL_ID || 'UCCpx-Awdsz14iEAsTDTz3ZQ';

// Simple in-memory cache to avoid hitting YouTube quota too often
// key -> { data: <array>, expiresAt: <timestamp> }
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}
function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Helper: fetch one page from YouTube
async function fetchYoutubePage(channelId, pageToken) {
  const maxResults = 50; // YouTube API max per request is 50
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('part', 'snippet,id');
  url.searchParams.set('order', 'date');
  url.searchParams.set('maxResults', String(maxResults));
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`YouTube API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

// Fetch ALL videos using paging (will stop when no nextPageToken)
async function fetchAllVideos(channelId) {
  const cacheKey = `youtube:${channelId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let allItems = [];
  let nextPageToken = null;

  do {
    const data = await fetchYoutubePage(channelId, nextPageToken);
    if (!data || !Array.isArray(data.items)) break;

    allItems = allItems.concat(data.items);
    nextPageToken = data.nextPageToken;
    // safety: prevent infinite loop (YouTube should stop pages eventually)
  } while (nextPageToken);

  setCached(cacheKey, allItems);
  return allItems;
}

router.get('/videos', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'YouTube API key not loaded from .env (YT_API_KEY)' });
    }

    const channelId = req.query.channelId || DEFAULT_CHANNEL_ID;

    const items = await fetchAllVideos(channelId);

    const formatted = items
      .filter(v => v.id && v.id.kind === 'youtube#video')
      .map(v => ({
        id: v.id.videoId,
        title: v.snippet?.title || '',
        description: v.snippet?.description || '',
        thumbnail: v.snippet?.thumbnails?.high?.url
          || v.snippet?.thumbnails?.default?.url || '',
        publishedAt: v.snippet?.publishedAt || null,
      }));

    res.json({ videos: formatted, count: formatted.length, cached: !!getCached(`youtube:${channelId}`) });
  } catch (err) {
    console.error('YouTube API Fetch Error:', err);
    res.status(500).json({ error: err.message || 'YouTube fetch failed' });
  }
});

export default router;
