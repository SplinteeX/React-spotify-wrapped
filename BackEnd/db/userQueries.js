// db/userQueries.js
import { getUsersCollection } from "../config/database.js";

/**
 * Upsert a user in the database
 * @param {Object} spotifyUser - Spotify user object from API
 * @param {string} refreshToken - Spotify refresh token
 * @returns {Promise<Object>} Result of the upsert operation
 */
export async function upsertUser(spotifyUser, refreshToken = null) {
  if (!spotifyUser?.id) {
    throw new Error("Invalid user data: missing spotify_id");
  }

  try {
    const usersCollection = getUsersCollection();

    // Prepare update data
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

    // Add refresh token if provided
    if (refreshToken) {
      updateData.$set.refresh_token = refreshToken;
    }

    const result = await usersCollection.updateOne(
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
  } catch (error) {
    console.error("❌ Database error in upsertUser:", error.message);
    throw error;
  }
}

/**
 * Find a user by Spotify ID
 * @param {string} spotifyId - Spotify user ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function findUserBySpotifyId(spotifyId) {
  try {
    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ spotify_id: spotifyId });
    return user;
  } catch (error) {
    console.error("❌ Database error in findUserBySpotifyId:", error.message);
    throw error;
  }
}

/**
 * Get user points by Spotify ID
 * @param {string} spotifyId - Spotify user ID
 * @returns {Promise<number>} User points or 0 if user not found
 */
export async function getUserPoints(spotifyId) {
  try {
    console.log("🔍 [DB] Getting points for user:", spotifyId);

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne(
      { spotify_id: spotifyId },
      { projection: { points: 1 } },
    );

    const points = user?.points || 0;
    console.log("📊 [DB] Retrieved points:", { spotifyId, points });

    return points;
  } catch (error) {
    console.error("❌ [DB] Database error in getUserPoints:", error.message);
    throw error;
  }
}

/**
 * Update user's refresh token
 * @param {string} spotifyId - Spotify user ID
 * @param {string} refreshToken - New refresh token
 * @returns {Promise<Object>} Update result
 */
export async function updateUserRefreshToken(spotifyId, refreshToken) {
  try {
    const usersCollection = getUsersCollection();
    const result = await usersCollection.updateOne(
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
  } catch (error) {
    console.error(
      "❌ Database error in updateUserRefreshToken:",
      error.message,
    );
    throw error;
  }
}

/**
 * Get user's refresh token from database
 * @param {string} spotifyId - Spotify user ID
 * @returns {Promise<string|null>} Refresh token or null if not found
 */
export async function getUserRefreshToken(spotifyId) {
  try {
    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne(
      { spotify_id: spotifyId },
      { projection: { refresh_token: 1 } },
    );

    return user?.refresh_token || null;
  } catch (error) {
    console.error("❌ Database error in getUserRefreshToken:", error.message);
    throw error;
  }
}

/**
 * Update user points
 * @param {string} spotifyId - Spotify user ID
 * @param {number} pointsToAdd - Points to add (can be negative)
 * @returns {Promise<Object>} Update result
 */
export async function updateUserPoints(spotifyId, pointsToAdd) {
  try {
    const usersCollection = getUsersCollection();
    const result = await usersCollection.updateOne(
      { spotify_id: spotifyId },
      {
        $inc: { points: pointsToAdd },
        $set: { updated_at: new Date() },
      },
    );

    console.log(`✅ Updated points for user: ${spotifyId} (+${pointsToAdd})`);
    return result;
  } catch (error) {
    console.error("❌ Database error in updateUserPoints:", error.message);
    throw error;
  }
}

/**
 * Add points to a user
 * @param {string} spotifyId - Spotify user ID
 * @param {number} points - Points to add
 * @param {string} reason - Reason for adding points (for logging)
 * @returns {Promise<Object>} Update result with new point total
 */
export async function addUserPoints(spotifyId, points, reason = "") {
  if (points <= 0) {
    throw new Error("Points to add must be positive");
  }

  try {
    const usersCollection = getUsersCollection();

    // Update points and get the updated document
    const result = await usersCollection.findOneAndUpdate(
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

    console.log(
      `✅ Added ${points} points to user ${spotifyId}. New total: ${result?.points}`,
    );

    return {
      success: true,
      pointsAdded: points,
      newTotal: result?.points,
      reason,
    };
  } catch (error) {
    console.error("❌ Database error in addUserPoints:", error.message);
    throw error;
  }
}

/**
 * Deduct points from a user
 * @param {string} spotifyId - Spotify user ID
 * @param {number} points - Points to deduct
 * @returns {Promise<Object>} Update result with new point total
 */
export async function deductUserPoints(spotifyId, points, reason = "") {
  if (points <= 0) {
    throw new Error("Points to deduct must be positive");
  }

  try {
    const usersCollection = getUsersCollection();

    // First check if user has enough points
    const user = await usersCollection.findOne(
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

    // Deduct points
    const result = await usersCollection.findOneAndUpdate(
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

    console.log(
      `✅ Deducted ${points} points from user ${spotifyId}. New total: ${result?.points}`,
    );

    return {
      success: true,
      pointsDeducted: points,
      newTotal: result?.points,
      reason,
    };
  } catch (error) {
    console.error("❌ Database error in deductUserPoints:", error.message);
    throw error;
  }
}
