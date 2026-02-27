// models/User.js
import mongoose from "mongoose";

const PurchasedBadgeSchema = new mongoose.Schema(
  {
    badge_id: { type: String, required: true },
    purchased_at: { type: Date, default: Date.now },
    price: { type: Number, default: 0 },
  },
  { _id: false },
);

const PointTransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    reason: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema({
  spotify_id: { type: String, required: true, unique: true, index: true },
  display_name: { type: String, default: null },
  email: { type: String, default: null },
  points: { type: Number, default: 0 },

  purchased_badges: { type: [PurchasedBadgeSchema], default: [] },

  point_transactions: { type: [PointTransactionSchema], default: [] },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
