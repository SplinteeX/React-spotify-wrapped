import axios from "axios";
import { SPOTIFY_API_URL } from "../config/spotify.js";

export async function validateToken(req, res, next) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({ error: "No access token provided" });
  }

  try {
    await axios.get(`${SPOTIFY_API_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    next();
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next();
  }
}
