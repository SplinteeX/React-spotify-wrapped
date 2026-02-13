import axios from "axios";
import { SPOTIFY_API_URL } from "../config/spotify.js";

export async function getTop(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const time_range = req.query.time_range || "medium_term";
  const limit = Math.min(parseInt(req.query.limit) || 50, 50);

  try {
    console.log("🎵 /api/top: Fetching data", { time_range, limit });

    const [artistsRes, tracksRes] = await Promise.all([
      axios.get(`${SPOTIFY_API_URL}/me/top/artists`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { time_range, limit, offset: 0 },
      }),
      axios.get(`${SPOTIFY_API_URL}/me/top/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { time_range, limit, offset: 0 },
      }),
    ]);

    const artists = artistsRes.data.items.map((artist, index) => ({
      ...artist,
      rank: index + 1,
    }));

    const tracks = tracksRes.data.items.map((track, index) => ({
      ...track,
      rank: index + 1,
    }));

    console.log("✅ /api/top: Success", {
      artists_count: artists.length,
      tracks_count: tracks.length,
      time_range,
    });

    res.json({
      artists,
      tracks,
      meta: {
        time_range,
        total_artists: artistsRes.data.total,
        total_tracks: tracksRes.data.total,
        limit,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("❌ /api/top: Failed", {
      status: e.response?.status,
      message: e.response?.data?.error?.message || e.message,
    });

    res.status(e.response?.status || 500).json({
      error: e.response?.data?.error?.message || "Failed to fetch top items",
      details: e.response?.data || {},
    });
  }
}
