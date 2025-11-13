import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // disable SSL checks (local dev only)

const router = express.Router();
const API_KEY = process.env.YT_API_KEY;
const CHANNEL_ID = "UCCpx-Awdsz14iEAsTDTz3ZQ";

router.get("/videos", async (req, res) => {
  console.log("⚡ [YouTube API] /videos endpoint hit");

  try {
    console.log("🔍 Checking API Key...");
    if (!API_KEY) {
      console.log("❌ No API key found in environment variables");
      return res.status(500).json({ error: "YouTube API key not loaded from .env" });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50`;

    console.log("🌐 Fetching YouTube API URL:", url);

    const response = await fetch(url);
    console.log("📩 YouTube Response Status:", response.status);

    if (!response.ok) {
      console.log("❌ YouTube API returned non-200 status");
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    console.log("📦 Raw YouTube Data Received:");
    console.log(JSON.stringify(data, null, 2).substring(0, 500), "..."); // print first 500 chars

    if (!data.items) {
      console.log("❌ No items array found in YouTube response");
      return res.status(500).json({ error: "Invalid API response", data });
    }

    console.log("🔍 Filtering only video results...");
    const filtered = data.items.filter((v) => v.id.kind === "youtube#video");

    console.log(`📊 Total Items: ${data.items.length}, Valid Videos: ${filtered.length}`);

    const formatted = filtered.map((v) => ({
      id: v.id.videoId,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnail: v.snippet.thumbnails?.high?.url,
    }));

    console.log("📤 Sending formatted video list to client...");
    console.log(JSON.stringify(formatted, null, 2).substring(0, 500), "...");

    res.json({ videos: formatted });
  } catch (err) {
    console.error("🔥 YouTube API Fetch Error:", err.stack || err.message);
    res.status(500).json({ error });
  }
});

export default router;
