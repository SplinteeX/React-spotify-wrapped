// models/Quest.js
import mongoose from "mongoose";

const QuestSchema = new mongoose.Schema({
  quest_id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  period: { type: String, default: "weekly" }, // weekly | monthly
  type: { type: String, default: "listen" },
  reward_points: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model("Quest", QuestSchema);

