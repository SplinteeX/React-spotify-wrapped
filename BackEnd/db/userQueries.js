// db/userQueries.js
import { getDB } from "../config/database.js";

function users() {
  return getDB().collection("users");
}

/**
 * Upsert a user in the database
 */
export async function upsertUser(spotifyUser, refreshToken = null) {
  if (!spotifyUser?.id) {
    throw new Error("Invalid user data: missing spotify_id");
  }

  const updateData = {
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
  };

  if (refreshToken) {
    updateData.$set.refresh_token = refreshToken;
  }

  const result = await users().updateOne(
    { spotify_id: spotifyUser.id },
    updateData,
    { upsert: true },
  );

  console.log(`✅ Upserted user in Atlas: ${spotifyUser.id}`, {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedId: result.upsertedId,
  });

  return result;
}

/**
 * Find a user by Spotify ID
 */
export async function findUserBySpotifyId(spotifyId) {
  return users().findOne({ spotify_id: spotifyId });
}

/**
 * Get user points by Spotify ID
 */
export async function getUserPoints(spotifyId) {
  const user = await users().findOne(
    { spotify_id: spotifyId },
    { projection: { points: 1 } },
  );
  return user?.points || 0;
}

/**
 * Update user's refresh token
 */
export async function updateUserRefreshToken(spotifyId, refreshToken) {
  const result = await users().updateOne(
    { spotify_id: spotifyId },
    {
      $set: {
        refresh_token: refreshToken,
        updated_at: new Date(),
      },
    },
  );
  console.log(`✅ Updated refresh token for user: ${spotifyId}`);
  return result;
}

/**
 * Get user's refresh token from database
 */
export async function getUserRefreshToken(spotifyId) {
  const user = await users().findOne(
    { spotify_id: spotifyId },
    { projection: { refresh_token: 1 } },
  );
  return user?.refresh_token || null;
}

/**
 * Add points to a user
 */
export async function addUserPoints(spotifyId, points, reason = "") {
  if (points <= 0) {
    throw new Error("Points to add must be positive");
  }

  const result = await users().findOneAndUpdate(
    { spotify_id: spotifyId },
    {
      $inc: { points: points },
      $set: { updated_at: new Date() },
      $push: {
        point_transactions: {
          amount: points,
          timestamp: new Date(),
        },
      },
    },
    {
      returnDocument: "after",
      projection: { points: 1 },
    },
  );

  if (!result) {
    throw new Error(`User ${spotifyId} not found`);
  }

  return {
    success: true,
    pointsAdded: points,
    newTotal: result.points,
    reason,
  };
}

/**
 * Deduct points from a user
 */
export async function deductUserPoints(spotifyId, points, reason = "") {
  if (points <= 0) {
    throw new Error("Points to deduct must be positive");
  }

  const user = await users().findOne(
    { spotify_id: spotifyId },
    { projection: { points: 1 } },
  );

  if (!user) {
    throw new Error(`User ${spotifyId} not found`);
  }

  if (user.points < points) {
    throw new Error(
      `Insufficient points: user has ${user.points}, tried to deduct ${points}`,
    );
  }

  const result = await users().findOneAndUpdate(
    { spotify_id: spotifyId },
    {
      $inc: { points: -points },
      $set: { updated_at: new Date() },
      $push: {
        point_transactions: {
          amount: -points,
          timestamp: new Date(),
        },
      },
    },
    {
      returnDocument: "after",
      projection: { points: 1 },
    },
  );

  return {
    success: true,
    pointsDeducted: points,
    newTotal: result.points,
    reason,
  };
}
