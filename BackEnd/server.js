// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import crypto from "crypto";

const app = express();

// Frontend (Vite) runs on 127.0.0.1:5173
app.use(
  cors({
    origin: "http://127.0.0.1:5173",
    credentials: true,
  })
);

// Enhanced request logger
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${req.ip}`
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- CONFIG ----
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "❌ SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not set. OAuth will fail."
  );
  process.exit(1);
}

// Use loopback IP instead of localhost
// This MUST match the Redirect URI in your Spotify app settings.
const REDIRECT_URI = "http://127.0.0.1:4000/auth/callback";
const FRONTEND_URL = "http://127.0.0.1:5173";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

// simple in‑memory store for demo (use DB/redis in production)
const codeVerifiers = new Map(); // state -> code_verifier
const refreshTokens = new Map(); // user_id -> refresh_token

// helpers
function generateRandomString(length) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

function createCodeChallenge(codeVerifier) {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function refreshAccessToken(refreshToken) {
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

// Token validation middleware
async function validateToken(req, res, next) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({ error: "No access token provided" });
  }

  try {
    // Verify token is valid by making a simple request
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

// ---- STEP 1: redirect to Spotify login ----
app.get("/auth/login", (req, res) => {
  const state = generateRandomString(16);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = createCodeChallenge(codeVerifier);

  codeVerifiers.set(state, codeVerifier);

  // FIXED: Added proper scope for audio-features access and playlist creation
  const scope = [
    "user-read-email",
    "user-read-private",
    "user-top-read",
    "user-follow-read",
    "user-read-playback-state",
    "user-read-recently-played",
    "playlist-modify-public",
    "playlist-modify-private",
    "streaming", // Required for some audio features
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
});

// ---- STEP 2: Spotify callback – exchange code for tokens ----
app.get("/auth/callback", async (req, res) => {
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

    // Get user profile to store refresh token
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

    // Redirect back to frontend with access token in URL fragment
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
});

// ---- Token refresh endpoint ----
app.post("/auth/refresh", async (req, res) => {
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
});

// ---- PROXY: get current user profile ----
app.get("/api/me", validateToken, async (req, res) => {
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
});

// ---- PROXY: get top artists & tracks ----
app.get("/api/top", validateToken, async (req, res) => {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  const time_range = req.query.time_range || "medium_term"; // short_term, medium_term, long_term
  const limit = Math.min(parseInt(req.query.limit) || 50, 50); // Max 50 items per request

  try {
    console.log("🎵 /api/top: Fetching data", { time_range, limit });

    // Fetch data in parallel
    const [artistsRes, tracksRes] = await Promise.all([
      axios.get(`${SPOTIFY_API_URL}/me/top/artists`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          time_range,
          limit,
          offset: 0,
        },
      }),
      axios.get(`${SPOTIFY_API_URL}/me/top/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          time_range,
          limit,
          offset: 0,
        },
      }),
    ]);

    // Process artists data
    const artists = artistsRes.data.items.map((artist, index) => ({
      ...artist,
      rank: index + 1,
    }));

    // Process tracks data with additional info
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
});

// ---- Additional endpoints for enhanced features ----

// Get multiple artists details in batch
app.get("/api/artists", validateToken, async (req, res) => {
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
});

// FIXED: Get audio features for tracks - Added validateToken middleware
app.get("/api/audio-features", validateToken, async (req, res) => {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const ids = req.query.ids;

  if (!ids) {
    return res.status(400).json({ error: "Track IDs required" });
  }

  // Validate IDs format and limit
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
      status: status,
      details: e.response?.data || {},
    });
  }
});

// FIXED: Get recently played tracks - Added validateToken middleware
app.get("/api/recently-played", validateToken, async (req, res) => {
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
      status: status,
      details: e.response?.data || {},
    });
  }
});

// Create playlist endpoint
app.post("/api/create-playlist", validateToken, async (req, res) => {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const { name, description, trackUris, userId } = req.body;

  if (!name || !trackUris || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    console.log("📝 /api/create-playlist: Creating playlist:", name);

    // Create the playlist
    const createRes = await axios.post(
      `${SPOTIFY_API_URL}/users/${userId}/playlists`,
      {
        name: name,
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

    // Add tracks to playlist (in chunks of 100)
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

    // Fetch the created playlist details
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
      status: status,
      details: e.response?.data || {},
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://127.0.0.1:${PORT}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔐 Redirect URI: ${REDIRECT_URI}`);
  console.log(`📊 Health check: http://127.0.0.1:${PORT}/health`);
  console.log(
    `⚠️  IMPORTANT: Make sure these scopes are enabled in your Spotify Developer Dashboard:`
  );
  console.log(`   - user-read-email`);
  console.log(`   - user-read-private`);
  console.log(`   - user-top-read`);
  console.log(`   - user-follow-read`);
  console.log(`   - user-read-playback-state`);
  console.log(`   - user-read-recently-played`);
  console.log(`   - playlist-modify-public (for playlist creation)`);
  console.log(`   - playlist-modify-private (for playlist creation)`);
  console.log(`   - streaming (for audio-features)`);
});
