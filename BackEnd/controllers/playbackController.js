import axios from "axios";
import { SPOTIFY_API_URL } from "../config/spotify.js";

export async function transferPlayback(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const { device_ids, play = false } = req.body;

  if (!device_ids || !Array.isArray(device_ids)) {
    return res.status(400).json({ error: "Device IDs array required" });
  }

  try {
    console.log(
      "🔄 /api/transfer-playback: Transferring playback to device",
      device_ids[0]
    );

    const response = await axios.put(
      `${SPOTIFY_API_URL}/me/player`,
      {
        device_ids,
        play,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 204) {
      console.log("✅ /api/transfer-playback: Success");
      return res.status(200).json({ success: true });
    }

    console.error(
      "❌ /api/transfer-playback: Unexpected response",
      response.status
    );
    return res
      .status(response.status)
      .json({ error: "Failed to transfer playback" });
  } catch (error) {
    console.error("❌ /api/transfer-playback: Failed", {
      status: error.response?.status,
      message: error.response?.data?.error?.message || error.message,
      data: error.response?.data,
    });

    const status = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.error?.message || "Failed to transfer playback";

    return res.status(status).json({
      error: errorMessage,
      status,
      details: error.response?.data || {},
    });
  }
}

export async function play(req, res) {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const { device_id, uris, position_ms = 0 } = req.body;

  if (!device_id || !uris) {
    return res.status(400).json({ error: "Device ID and URIs required" });
  }

  try {
    console.log("▶️ /api/play: Starting playback", { device_id, position_ms });

    const queryParams = new URLSearchParams({ device_id }).toString();

    const response = await axios.put(
      `${SPOTIFY_API_URL}/me/player/play?${queryParams}`,
      {
        uris: Array.isArray(uris) ? uris : [uris],
        position_ms: Math.floor(position_ms),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 204) {
      console.log("✅ /api/play: Success");
      return res.status(200).json({ success: true });
    }

    console.error("❌ /api/play: Unexpected response", response.status);
    return res
      .status(response.status)
      .json({ error: "Failed to start playback" });
  } catch (error) {
    console.error("❌ /api/play: Failed", {
      status: error.response?.status,
      message: error.response?.data?.error?.message || error.message,
      data: error.response?.data,
    });

    const status = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.error?.message || "Failed to start playback";

    if (error.response?.data?.error?.reason === "PREMIUM_REQUIRED") {
      return res.status(403).json({
        error: "Premium account required for playback",
        details: error.response?.data,
      });
    }

    return res.status(status).json({
      error: errorMessage,
      status,
      details: error.response?.data || {},
    });
  }
}
