import { Router } from "express";
import { login, callback, refresh } from "../controllers/authController.js";

const router = Router();

router.get("/login", login);
router.get("/callback", callback);
router.post("/refresh", refresh);

export default router;
