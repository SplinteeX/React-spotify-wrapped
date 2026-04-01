// db/questsQueries.js
import { getDB } from "../config/database.js";
import { Quests } from "../data/questsData.js";

function quests() {
  return getDB().collection("quests");
}

function users() {
  return getDB().collection("users");
}

/**
 * Seed quests from questsData if they don't exist.
 */
export async function seedQuests() {
  const col = quests();
  const seedIds = Quests.map((q) => q.quest_id);

  const existing = await col
    .find({ quest_id: { $in: seedIds } }, { projection: { quest_id: 1 } })
    .toArray();

  const existingSet = new Set(existing.map((d) => d.quest_id));

  const now = new Date();
  const toInsert = Quests.filter((q) => !existingSet.has(q.quest_id)).map(
    (q) => ({
      quest_id: q.quest_id,
      title: q.title,
      description: q.description ?? "",
      period: q.period ?? "weekly",
      type: q.type ?? "listen",
      reward_points: Number(q.reward_points ?? 0),
      is_active: true,
      created_at: now,
      updated_at: now,
    }),
  );

  if (toInsert.length === 0) {
    console.log("✅ Quests already exist in database");
    return;
  }

  const res = await col.insertMany(toInsert, { ordered: false });
  console.log("✅ Created missing quests", {
    inserted: res.insertedCount,
    insertedIds: Object.values(res.insertedIds ?? {}),
  });
}

/**
 * Get all active quests.
 */
export async function getAllQuests() {
  return quests().find({ is_active: true }).toArray();
}

/**
 * Get quest definitions and claimed quest ids for a user.
 */
export async function getUserQuestState(spotifyId) {
  const [allQuests, user] = await Promise.all([
    getAllQuests(),
    users().findOne(
      { spotify_id: spotifyId },
      { projection: { claimed_quests: 1 } },
    ),
  ]);

  const claimedQuestIds = user?.claimed_quests ?? [];

  return {
    quests: allQuests,
    claimedQuestIds,
  };
}

/**
 * Claim a quest reward for a user.
 * - Ensures quest exists and is active
 * - Ensures user exists
 * - Ensures quest not already claimed
 * - Adds reward points + claim record + point transaction atomically
 */
export async function claimQuestForUser(spotifyId, questId) {
  const questsCol = quests();
  const usersCol = users();

  const quest = await questsCol.findOne(
    { quest_id: questId, is_active: true },
    { projection: { quest_id: 1, reward_points: 1, title: 1 } },
  );

  if (!quest) {
    throw new Error(`Quest ${questId} not found`);
  }

  const reward = Number(quest.reward_points ?? 0);

  const res = await usersCol.findOneAndUpdate(
    {
      spotify_id: spotifyId,
      claimed_quests: { $ne: questId },
    },
    {
      $inc: { points: reward },
      $set: { updated_at: new Date() },
      $push: {
        claimed_quests: questId,
        point_transactions: {
          amount: reward,
          reason: `quest_${questId}`,
          timestamp: new Date(),
        },
      },
    },
    {
      returnDocument: "after",
      projection: { points: 1, claimed_quests: 1 },
    },
  );

  if (!res?.value) {
    const user = await usersCol.findOne(
      { spotify_id: spotifyId },
      { projection: { claimed_quests: 1 } },
    );

    if (!user) throw new Error(`User ${spotifyId} not found`);

    const alreadyClaimed = (user.claimed_quests ?? []).includes(questId);
    if (alreadyClaimed) throw new Error("Quest reward already claimed");

    throw new Error("Failed to claim quest");
  }

  const newPoints = res.value.points ?? 0;
  const claimedQuestIds = res.value.claimed_quests ?? [];

  return {
    success: true,
    questId,
    reward,
    newTotal: newPoints,
    claimedQuestIds,
  };
}

