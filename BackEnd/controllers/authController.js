// controllers/authController.js
import axios from "axios";
import { getUsersCollection } from "../config/database.js";
import {
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
  FRONTEND_URL,
  SPOTIFY_AUTH_URL,
  SPOTIFY_TOKEN_URL,
  SPOTIFY_API_URL,
  codeVerifiers,
  refreshTokens,
  generateRandomString,
  createCodeChallenge,
  refreshAccessToken,
} from "../config/spotify.js";

// ------------------- Login -------------------
export function login(req, res) {
  const state = generateRandomString(16);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = createCodeChallenge(codeVerifier);

  codeVerifiers.set(state, codeVerifier);

  const scope = [
    "user-read-email",
    "user-read-private",
    "user-top-read",
    "user-follow-read",
    "user-read-playback-state",
    "user-read-recently-played",
    "playlist-modify-public",
    "playlist-modify-private",
    "streaming",
    "user-modify-playback-state",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    state,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  console.log(`🔑 /auth/login: Redirecting to Spotify with state ${state}`);
  return res.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
}

// ------------------- Callback -------------------
export async function callback(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    console.warn(`❌ /auth/callback: Error from Spotify: ${error}`);
    return res.redirect(`${FRONTEND_URL}/?error=${encodeURIComponent(error)}`);
  }

  const codeVerifier = codeVerifiers.get(state);
  if (!state || !codeVerifier) {
    console.warn("❌ /auth/callback: State mismatch or missing verifier");
    return res.redirect(`${FRONTEND_URL}/?error=state_mismatch`);
  }

  codeVerifiers.delete(state);

  try {
    console.log(
      `🔄 /auth/callback: Exchanging code for tokens (state: ${state})`,
    );

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    const tokenRes = await axios.post(SPOTIFY_TOKEN_URL, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    console.log("✅ /auth/callback: Token exchange successful");

    // ------------------- Fetch Spotify User -------------------
    try {
      const userRes = await axios.get(`${SPOTIFY_API_URL}/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const spotifyUser = userRes.data;

      if (spotifyUser?.id) {
        console.log(
          `🔍 /auth/callback: Fetched Spotify user: ${spotifyUser.id}`,
        );

        const usersCollection = getUsersCollection();

        // Store refresh token in memory (optional)
        if (refresh_token) {
          refreshTokens.set(spotifyUser.id, refresh_token);
          console.log(`💾 Stored refresh token for user: ${spotifyUser.id}`);
        }

        // Upsert user (single reliable write)
        await usersCollection.updateOne(
          { spotify_id: spotifyUser.id },
          {
            $set: {
              spotify_id: spotifyUser.id,
              display_name: spotifyUser.display_name || null,
              email: spotifyUser.email || null,
              updated_at: new Date(),
            },
            $setOnInsert: {
              points: 0,
              created_at: new Date(),
            },
          },
          { upsert: true },
        );

        console.log(`✅ Upserted user in Atlas: ${spotifyUser.id}`);
      } else {
        console.warn("⚠️ Spotify user id missing from /me response");
      }
    } catch (userError) {
      console.warn(
        "⚠️ Could not fetch Spotify user profile:",
        userError.message,
      );
    }

    // ------------------- Redirect to Frontend -------------------
    const redirectParams = new URLSearchParams({
      access_token,
      refresh_token: refresh_token || "",
      expires_in: String(expires_in || 3600),
    });

    console.log("↪️ /auth/callback: Redirecting back to frontend");
    return res.redirect(
      `${FRONTEND_URL}/callback#${redirectParams.toString()}`,
    );
  } catch (e) {
    console.error("❌ /auth/callback: Token exchange failed", {
      status: e.response?.status,
      data: e.response?.data,
      message: e.message,
    });
    return res.redirect(`${FRONTEND_URL}/?error=token_exchange_failed`);
  }
}

// ------------------- Refresh Token -------------------
export async function refresh(req, res) {
  const { refresh_token, user_id } = req.body;

  if (!refresh_token && !user_id) {
    return res.status(400).json({ error: "Refresh token or user ID required" });
  }

  try {
    const tokenToRefresh = refresh_token || refreshTokens.get(user_id);

    if (!tokenToRefresh) {
      return res.status(404).json({ error: "Refresh token not found" });
    }

    const newTokens = await refreshAccessToken(tokenToRefresh);

    if (!newTokens) {
      return res.status(401).json({ error: "Failed to refresh token" });
    }

    console.log(
      `🔄 /auth/refresh: Tokens refreshed for user ${user_id || "unknown"}`,
    );

    return res.json({
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in,
      refresh_token: newTokens.refresh_token || tokenToRefresh,
    });
  } catch (error) {
    console.error("❌ /auth/refresh:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
