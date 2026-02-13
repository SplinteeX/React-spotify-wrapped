import { Router } from "express";
import {
  getArtists,
  getAudioFeatures,
  getRecentlyPlayed,
  createPlaylist,
} from "../controllers/spotifyDataController.js";
import { validateToken } from "../middleware/validateToken.js";

const router = Router();

router.get("/artists", validateToken, getArtists);
router.get("/audio-features", validateToken, getAudioFeatures);
router.get("/recently-played", validateToken, getRecentlyPlayed);
router.post("/create-playlist", validateToken, createPlaylist);

export default router;
