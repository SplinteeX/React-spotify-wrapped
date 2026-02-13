import axios from "axios";
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
  res.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
}

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
      `🔄 /auth/callback: Exchanging code for tokens (state: ${state})`
    );

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    const tokenRes = await axios.post(SPOTIFY_TOKEN_URL, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${CLIENT_ID}:${CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    console.log("✅ /auth/callback: Token exchange successful");

    try {
      const userRes = await axios.get(`${SPOTIFY_API_URL}/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (userRes.data?.id && refresh_token) {
        refreshTokens.set(userRes.data.id, refresh_token);
        console.log(`💾 Stored refresh token for user: ${userRes.data.id}`);
      }
    } catch (userError) {
      console.warn(
        "Could not fetch user profile for token storage:",
        userError.message
      );
    }

    const redirectParams = new URLSearchParams({
      access_token,
      refresh_token: refresh_token || "",
      expires_in: String(expires_in || 3600),
    });

    console.log("↪️ /auth/callback: Redirecting back to frontend");
    res.redirect(`${FRONTEND_URL}/callback#${redirectParams.toString()}`);
  } catch (e) {
    console.error("❌ /auth/callback: Token exchange failed", {
      status: e.response?.status,
      data: e.response?.data,
    });
    res.redirect(`${FRONTEND_URL}/?error=token_exchange_failed`);
  }
}

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

    res.json({
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in,
      refresh_token: newTokens.refresh_token || tokenToRefresh,
    });
  } catch (error) {
    console.error("❌ /auth/refresh:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
