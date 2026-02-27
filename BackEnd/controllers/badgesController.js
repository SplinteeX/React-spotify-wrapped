// controllers/badgesController.js
import {
  getUserPurchasedBadgeIds,
  purchaseBadgeForUser,
} from "../db/badgesQueries.js";

export async function getAllBadges() {
  const db = getDb();
  return await db.collection("badges").find({ is_active: true }).toArray();
}

export async function getPurchasedBadges(req, res) {
  const { userId } = req.params;

  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const purchasedBadges = await getUserPurchasedBadgeIds(userId);
    return res.json({ userId, purchasedBadges });
  } catch (error) {
    console.error("Error in getPurchasedBadges:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

export async function purchaseBadge(req, res) {
  const { userId } = req.params;
  const { badgeId } = req.body;

  if (!userId) return res.status(400).json({ error: "User ID is required" });
  if (!badgeId) return res.status(400).json({ error: "badgeId is required" });

  try {
    const result = await purchaseBadgeForUser(userId, badgeId);
    return res.json(result);
  } catch (error) {
    console.error("Error in purchaseBadge:", error.message);

    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (
      error.message.includes("Insufficient points") ||
      error.message.includes("already own")
    ) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Failed to purchase badge" });
  }
}
