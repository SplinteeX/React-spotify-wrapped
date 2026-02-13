import axios from "axios";
import { SPOTIFY_API_URL } from "../config/spotify.js";

export async function getArtists(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const ids = req.query.ids;

  if (!ids) {
    return res.status(400).json({ error: "Artist IDs required" });
  }

  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/artists`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { ids },
    });

    res.json(response.data);
  } catch (e) {
    console.error("❌ /api/artists:", e.message);
    res.status(e.response?.status || 500).json({
      error: "Failed to fetch artists",
    });
  }
}

export async function getAudioFeatures(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const ids = req.query.ids;

  if (!ids) {
    return res.status(400).json({ error: "Track IDs required" });
  }

  const idArray = ids.split(",");
  if (idArray.length > 100) {
    return res.status(400).json({
      error: "Maximum 100 track IDs allowed per request",
    });
  }

  try {
    console.log(
      "🎵 /api/audio-features: Fetching features for",
      idArray.length,
      "tracks"
    );

    const response = await axios.get(`${SPOTIFY_API_URL}/audio-features`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      params: { ids },
    });

    console.log("✅ /api/audio-features: Success");
    res.json(response.data);
  } catch (e) {
    console.error("❌ /api/audio-features: Failed", {
      status: e.response?.status,
      message: e.response?.data?.error?.message || e.message,
      data: e.response?.data,
    });

    const status = e.response?.status || 500;
    const errorMessage =
      e.response?.data?.error?.message || "Failed to fetch audio features";

    res.status(status).json({
      error: errorMessage,
      status,
      details: e.response?.data || {},
    });
  }
}

export async function getRecentlyPlayed(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  try {
    console.log("⏱️ /api/recently-played: Fetching", limit, "tracks");
    const response = await axios.get(
      `${SPOTIFY_API_URL}/me/player/recently-played`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        params: { limit },
      }
    );

    console.log("✅ /api/recently-played: Success");
    res.json(response.data);
  } catch (e) {
    console.error("❌ /api/recently-played:", {
      status: e.response?.status,
      message: e.response?.data?.error?.message || e.message,
      data: e.response?.data,
    });

    const status = e.response?.status || 500;
    const errorMessage =
      e.response?.data?.error?.message ||
      "Failed to fetch recently played tracks";

    res.status(status).json({
      error: errorMessage,
      status,
      details: e.response?.data || {},
    });
  }
}

export async function createPlaylist(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const { name, description, trackUris, userId } = req.body;

  if (!name || !trackUris || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    console.log("📝 /api/create-playlist: Creating playlist:", name);

    const createRes = await axios.post(
      `${SPOTIFY_API_URL}/users/${userId}/playlists`,
      {
        name,
        description: description || "",
        public: true,
        collaborative: false,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const playlistId = createRes.data.id;
    console.log(`✅ Playlist created with ID: ${playlistId}`);

    if (trackUris.length > 0) {
      const chunks = [];
      for (let i = 0; i < trackUris.length; i += 100) {
        chunks.push(trackUris.slice(i, i + 100));
      }

      for (const chunk of chunks) {
        await axios.post(
          `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`,
          { uris: chunk },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }

      console.log(`✅ Added ${trackUris.length} tracks to playlist`);
    }

    const playlistRes = await axios.get(
      `${SPOTIFY_API_URL}/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log("✅ /api/create-playlist: Success");
    res.json(playlistRes.data);
  } catch (e) {
    console.error("❌ /api/create-playlist: Failed", {
      status: e.response?.status,
      message: e.response?.data?.error?.message || e.message,
      data: e.response?.data,
    });

    const status = e.response?.status || 500;
    const errorMessage =
      e.response?.data?.error?.message || "Failed to create playlist";

    res.status(status).json({
      error: errorMessage,
      status,
      details: e.response?.data || {},
    });
  }
}
