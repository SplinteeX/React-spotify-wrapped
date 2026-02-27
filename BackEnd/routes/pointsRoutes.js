// routes/pointsRoutes.js
import express from "express";
import {
  getPoints,
  addPoints,
  deductPoints,
} from "../controllers/pointsController.js";

const router = express.Router();

/**
 * @route   GET /api/points/:userId
 * @desc    Get points for a specific user
 * @access  Public (or protected - adjust based on your auth requirements)
 */
router.get("/:userId/points", getPoints);

/**
 * @route   POST /api/points/:userId/add
 * @desc    Add points to a user
 * @access  Protected (should require authentication)
 */
router.post("/:userId/addPoints", addPoints);

/**
 * @route   POST /api/points/:userId/deduct
 * @desc    Deduct points from a user
 * @access  Protected
 */
router.post("/:userId/deductPoints", deductPoints);

export default router;
