import "dotenv/config";

import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/logger.js";
import authRoutes from "./routes/authRoutes.js";
import playbackRoutes from "./routes/playbackRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import spotifyDataRoutes from "./routes/spotifyDataRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import pointsRoutes from "./routes/pointsRoutes.js";
import { FRONTEND_URL, REDIRECT_URI } from "./config/spotify.js";
import { connectDB } from "./config/database.js";
import badgesRoutes from "./routes/badgesRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://127.0.0.1:5173",
    credentials: true,
  }),
);

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mount routes
app.use("/auth", authRoutes);
app.use("/api", playbackRoutes);
app.use("/api", userRoutes);
app.use("/api", statsRoutes);
app.use("/api", spotifyDataRoutes);
app.use("/", healthRoutes);
app.use("/user", pointsRoutes);
app.use("/user", badgesRoutes);
app.use;

// error handler
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

export async function initApp() {
  try {
    await connectDB();

    console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
    console.log(`🔐 Redirect URI: ${REDIRECT_URI}`);
    console.log(`📊 Health check: /health`);

    console.log(`🎵 Web Playback SDK endpoints ready:`);
    console.log(`   - PUT /api/transfer-playback`);
    console.log(`   - PUT /api/play (with position_ms)`);

    console.log(`⚠️  Required Spotify scopes:`);
    console.log(`   - user-read-email`);
    console.log(`   - user-read-private`);
    console.log(`   - user-top-read`);
    console.log(`   - user-follow-read`);
    console.log(`   - user-read-playback-state`);
    console.log(`   - user-read-recently-played`);
    console.log(`   - playlist-modify-public`);
    console.log(`   - playlist-modify-private`);
    console.log(`   - streaming`);
    console.log(`   - user-modify-playback-state`);

    return app;
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
  }
}
