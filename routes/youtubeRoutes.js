
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // disable SSL checks (local dev only)

const router = express.Router();
const API_KEY = process.env.YT_API_KEY;
const CHANNEL_ID = "UCCpx-Awdsz14iEAsTDTz3ZQ";

router.get("/videos", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "YouTube API key not loaded from .env" });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=500`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);

    const data = await response.json();

    if (!data.items) {
      return res.status(500).json({ error: "Invalid API response", data });
    }

    const formatted = data.items
      .filter((v) => v.id.kind === "youtube#video")
      .map((v) => ({
        id: v.id.videoId,
        title: v.snippet.title,
        description: v.snippet.description,
        thumbnail: v.snippet.thumbnails.high.url,
      }));

    res.json({ videos: formatted });
  } catch (err) {
    console.error("YouTube API Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;