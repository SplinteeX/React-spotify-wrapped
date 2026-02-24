// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  spotify_id: { type: String, required: true, unique: true, index: true },
  display_name: { type: String, default: null },
  email: { type: String, default: null },
  points: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
