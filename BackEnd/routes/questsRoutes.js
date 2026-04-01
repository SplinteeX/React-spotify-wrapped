// routes/questsRoutes.js
import express from "express";
import {
  getQuests,
  getUserQuests,
  claimQuest,
} from "../controllers/questsController.js";

const router = express.Router();

// GET /user/quests -> all quests
router.get("/quests", getQuests);

// GET /user/:userId/quests -> quests + claimed state for user
router.get("/:userId/quests", getUserQuests);

// POST /user/:userId/quests/:questId/claim -> claim quest reward
router.post("/:userId/quests/:questId/claim", claimQuest);

export default router;

