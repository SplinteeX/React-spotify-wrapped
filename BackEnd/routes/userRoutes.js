import { Router } from "express";
import { getMe } from "../controllers/userController.js";
import { validateToken } from "../middleware/validateToken.js";

const router = Router();

router.get("/me", validateToken, getMe);

export default router;
