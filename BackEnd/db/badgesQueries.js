// db/badgesQueries.js
import { getDB } from "../config/database.js";
import { Badges } from "../data/badgesData.js";

function users() {
  return getDB().collection("users");
}

function badges() {
  return getDB().collection("badges");
}

/**
 * Seed badges from badgesData if they don't exist
 */
export async function seedBadges() {
  const col = badges();
  const seedIds = Badges.map((b) => b.id);

  const existing = await col
    .find({ badge_id: { $in: seedIds } }, { projection: { badge_id: 1 } })
    .toArray();

  const existingSet = new Set(existing.map((d) => d.badge_id));

  const now = new Date();
  const toInsert = Badges.filter((b) => !existingSet.has(b.id)).map((b) => ({
    badge_id: b.id,
    name: b.name,
    description: b.description ?? "",
    category: b.category ?? "all",
    price: Number(b.price ?? 0),
    icon: b.icon ?? "",
    rarity: b.rarity ?? "common",
    gradient: b.gradient ?? "",
    is_active: true,
    created_at: now,
    updated_at: now,
  }));

  if (toInsert.length === 0) {
    console.log("✅ Badges already exist in database");
    return;
  }

  const res = await col.insertMany(toInsert, { ordered: false });
  console.log("✅ Created missing badges", {
    inserted: res.insertedCount,
    insertedIds: Object.values(res.insertedIds ?? {}),
  });
}

/**
 * Get all active badges
 */
export async function getAllBadges() {
  return badges().find({ is_active: true }).toArray();
}

/**
 * Return purchased badge ids for a user
 */
export async function getUserPurchasedBadgeIds(spotifyId) {
  const user = await users().findOne(
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
  const usersCol = users();
  const badgesCol = badges();

  const badge = await badgesCol.findOne(
    { badge_id: badgeId, is_active: true },
    { projection: { badge_id: 1, price: 1, name: 1 } },
  );

  if (!badge) {
    throw new Error(`Badge ${badgeId} not found`);
  }

  const price = Number(badge.price ?? 0);

  const res = await usersCol.findOneAndUpdate(
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
    const user = await usersCol.findOne(
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
