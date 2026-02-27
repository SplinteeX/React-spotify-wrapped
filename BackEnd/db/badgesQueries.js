// db/badgeQueries.js
import { getUsersCollection, getBadgesCollection } from "../config/database.js";

/**
 * Return purchased badge ids for a user
 */
export async function getUserPurchasedBadgeIds(spotifyId) {
  const users = getUsersCollection();
  const user = await users.findOne(
    { spotify_id: spotifyId },
    { projection: { purchased_badges: 1 } },
  );

  const purchased = user?.purchased_badges ?? [];
  return purchased.map((b) => b.badge_id);
}

/**
 * Purchase a badge:
 * - Ensures badge exists and is_active
 * - Ensures user exists
 * - Ensures not already owned
 * - Ensures enough points
 * - Deducts points + adds purchased badge + adds point transaction (all in ONE update)
 */
export async function purchaseBadgeForUser(spotifyId, badgeId) {
  const users = getUsersCollection();
  const badges = getBadgesCollection();

  // 1) Fetch badge (authoritative price)
  const badge = await badges.findOne(
    { badge_id: badgeId, is_active: true },
    { projection: { badge_id: 1, price: 1, name: 1 } },
  );

  if (!badge) {
    throw new Error(`Badge ${badgeId} not found`);
  }

  const price = Number(badge.price ?? 0);

  const res = await users.findOneAndUpdate(
    {
      spotify_id: spotifyId,
      points: { $gte: price },
      "purchased_badges.badge_id": { $ne: badgeId },
    },
    {
      $inc: { points: -price },
      $set: { updated_at: new Date() },
      $push: {
        purchased_badges: {
          badge_id: badgeId,
          purchased_at: new Date(),
          price,
        },
        point_transactions: {
          amount: -price,
          reason: `purchased_badge_${badgeId}`,
          timestamp: new Date(),
        },
      },
    },
    {
      returnDocument: "after",
      projection: { points: 1, purchased_badges: 1 },
    },
  );

  if (!res?.value) {
    const user = await users.findOne(
      { spotify_id: spotifyId },
      { projection: { points: 1, purchased_badges: 1 } },
    );

    if (!user) throw new Error(`User ${spotifyId} not found`);

    const alreadyOwned = (user.purchased_badges ?? []).some(
      (b) => b.badge_id === badgeId,
    );
    if (alreadyOwned) throw new Error("You already own this badge!");

    const pts = Number(user.points ?? 0);
    if (pts < price) {
      throw new Error(
        `Insufficient points: user has ${pts}, needs ${price} to buy ${badgeId}`,
      );
    }

    throw new Error("Failed to purchase badge");
  }

  const newPoints = res.value.points ?? 0;
  const purchasedIds = (res.value.purchased_badges ?? []).map(
    (b) => b.badge_id,
  );

  return {
    success: true,
    badgeId,
    price,
    newTotal: newPoints,
    purchasedBadges: purchasedIds,
  };
}
