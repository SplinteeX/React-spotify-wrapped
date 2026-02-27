// controllers/pointsController.js
import {
  getUserPoints,
  addUserPoints,
  deductUserPoints,
} from "../db/userQueries.js";

// Get points for a single user
export async function getPoints(req, res) {
  const { userId } = req.params;
  console.log("Retrieving points", userId);
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const points = await getUserPoints(userId);
    res.json({ userId, points });
  } catch (error) {
    console.error("Error in getPoints:", error.message);
    res.status(500).json({ error: error.message });
  }
}

// Add points to a user
export async function addPoints(req, res) {
  const { userId } = req.params;
  const { points, reason } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!points || typeof points !== "number" || points <= 0) {
    return res
      .status(400)
      .json({ error: "Valid positive number of points is required" });
  }

  try {
    const result = await addUserPoints(userId, points, reason || "manual_add");
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in addPoints:", error.message);

    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
}

// Deduct points from a user
export async function deductPoints(req, res) {
  const { userId } = req.params;
  const { points, reason } = req.body;

  // Input validation
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!points || typeof points !== "number" || points <= 0) {
    return res
      .status(400)
      .json({ error: "Valid positive number of points is required" });
  }

  try {
    const result = await deductUserPoints(
      userId,
      points,
      reason || "manual_deduct",
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in deductPoints:", error.message);

    // Handle specific error cases
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("Insufficient points")) {
      return res.status(400).json({ error: error.message });
    }

    // Generic error
    res.status(500).json({ error: "Failed to deduct points" });
  }
}
