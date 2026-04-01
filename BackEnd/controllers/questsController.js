// controllers/questsController.js
import {
  getAllQuests,
  getUserQuestState,
  claimQuestForUser,
} from "../db/questsQueries.js";

// GET /user/quests -> all active quests
export async function getQuests(req, res) {
  try {
    const quests = await getAllQuests();
    return res.json(quests);
  } catch (error) {
    console.error("Error in getQuests:", error.message);
    return res.status(500).json({ error: "Failed to fetch quests" });
  }
}

// GET /user/:userId/quests -> quests + claimed info for user
export async function getUserQuests(req, res) {
  const { userId } = req.params;

  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const state = await getUserQuestState(userId);
    return res.json({ userId, ...state });
  } catch (error) {
    console.error("Error in getUserQuests:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

// POST /user/:userId/quests/:questId/claim -> claim quest reward
export async function claimQuest(req, res) {
  const { userId, questId } = req.params;

  if (!userId) return res.status(400).json({ error: "User ID is required" });
  if (!questId) return res.status(400).json({ error: "Quest ID is required" });

  try {
    const result = await claimQuestForUser(userId, questId);
    return res.json(result);
  } catch (error) {
    console.error("Error in claimQuest:", error.message);

    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("already claimed")) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Failed to claim quest reward" });
  }
}

