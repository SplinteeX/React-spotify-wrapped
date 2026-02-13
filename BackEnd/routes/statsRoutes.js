import { Router } from "express";
import { getTop } from "../controllers/statsController.js";
import { validateToken } from "../middleware/validateToken.js";

const router = Router();

router.get("/top", validateToken, getTop);

export default router;
