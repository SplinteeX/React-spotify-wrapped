import axios from "axios";
import { SPOTIFY_API_URL } from "../config/spotify.js";

export async function getMe(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  try {
    console.log("👤 /api/me: Fetching user profile");

    const [profileRes, followingRes] = await Promise.all([
      axios.get(`${SPOTIFY_API_URL}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      axios
        .get(`${SPOTIFY_API_URL}/me/following?type=artist&limit=1`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => ({ data: { artists: { total: 0 } } })),
    ]);

    const userData = {
      ...profileRes.data,
      following_count: followingRes.data.artists?.total || 0,
    };

    console.log("✅ /api/me: Success");
    res.json(userData);
  } catch (e) {
    console.error("❌ /api/me: Failed", {
      status: e.response?.status,
      message: e.response?.data?.error?.message || e.message,
    });

    res.status(e.response?.status || 500).json({
      error: e.response?.data?.error?.message || "Failed to fetch profile",
      details: e.response?.data || {},
    });
  }
}
