// controllers/userController.js
import axios from "axios";
import { getUsersCollection } from "../config/database.js";
import { SPOTIFY_API_URL } from "../config/spotify.js";

// ------------------- Get Me -------------------
export async function getMe(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({ error: "Missing access token" });
  }

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
    return res.json(userData);
  } catch (e) {
    console.error("❌ /api/me: Failed", {
      status: e.response?.status,
      message: e.response?.data?.error?.message || e.message,
      data: e.response?.data,
    });

    return res.status(e.response?.status || 500).json({
      error: e.response?.data?.error?.message || "Failed to fetch profile",
      details: e.response?.data || {},
    });
  }
}
