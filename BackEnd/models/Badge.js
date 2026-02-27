// models/Badge.js
import mongoose from "mongoose";

const BadgeSchema = new mongoose.Schema({
  badge_id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, default: "all" },
  price: { type: Number, default: 0 },
  icon: { type: String, default: "" },
  rarity: { type: String, default: "common" },
  gradient: { type: String, default: "" },

  is_active: { type: Boolean, default: true },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model("Badge", BadgeSchema);
