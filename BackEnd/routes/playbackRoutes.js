import { Router } from "express";
import { transferPlayback, play } from "../controllers/playbackController.js";
import { validateToken } from "../middleware/validateToken.js";

const router = Router();

router.put("/transfer-playback", validateToken, transferPlayback);
router.put("/play", validateToken, play);

export default router;
