import crypto from "crypto";
import axios from "axios";

export const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
export const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "❌ SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not set. OAuth will fail."
  );
  process.exit(1);
}

export const REDIRECT_URI = "http://127.0.0.1:4000/auth/callback";
export const FRONTEND_URL = "http://127.0.0.1:5173";

export const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_API_URL = "https://api.spotify.com/v1";

// simple in‑memory stores
export const codeVerifiers = new Map(); // state -> code_verifier
export const refreshTokens = new Map(); // user_id -> refresh_token

export function generateRandomString(length) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

export function createCodeChallenge(codeVerifier) {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function refreshAccessToken(refreshToken) {
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await axios.post(SPOTIFY_TOKEN_URL, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to refresh token:", error.message);
    return null;
  }
}
