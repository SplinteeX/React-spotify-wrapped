// routes/badgesRoutes.js
import express from "express";
import {
  getPurchasedBadges,
  purchaseBadge,
  getAllBadges,
} from "../controllers/badgesController.js";

const router = express.Router();

// GET /user/badges  -> all badges
router.get("/badges", getAllBadges);

// GET /user/:userId/badges -> purchased badge ids
router.get("/:userId/badges", getPurchasedBadges);

// POST /user/:userId/badges/purchase -> purchase
router.post("/:userId/badges/purchase", purchaseBadge);

export default router;