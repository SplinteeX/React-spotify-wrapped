// src/config/database.js
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

// ✅ ESM needs the file extension
import { Badges } from "../data/badgesData.js";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI in environment");

let client;
let db;

export function getUsersCollection() {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db.collection("users");
}

export function getBadgesCollection() {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db.collection("badges");
}

async function createBadgesOnStartup() {
  const col = getBadgesCollection();

  const seedIds = Badges.map((b) => b.id);

  // Find existing badge_id values that match our seed list
  const existing = await col
    .find({ badge_id: { $in: seedIds } }, { projection: { badge_id: 1 } })
    .toArray();

  const existingSet = new Set(existing.map((d) => d.badge_id));

  // Insert only missing badges
  const now = new Date();
  const toInsert = Badges.filter((b) => !existingSet.has(b.id)).map((b) => ({
    badge_id: b.id,
    name: b.name,
    description: b.description ?? "",
    category: b.category ?? "all",
    price: Number(b.price ?? 0),
    icon: b.icon ?? "",
    rarity: b.rarity ?? "common",
    gradient: b.gradient ?? "",
    is_active: true,
    created_at: now,
    updated_at: now,
  }));

  if (toInsert.length === 0) {
    console.log("✅ Badges already exist in database");
    return;
  }

  const res = await col.insertMany(toInsert, { ordered: false });

  console.log("✅ Created missing badges", {
    inserted: res.insertedCount,
    insertedIds: Object.values(res.insertedIds ?? {}),
  });
}

export async function connectDB() {
  if (db) return db;

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();

  // Uses DB from env if set, otherwise uses the default DB in the URI
  db = client.db(process.env.MONGODB_DB_NAME || undefined);

  console.log("✅ Connected to MongoDB");

  await createBadgesOnStartup();

  return db;
}

// Optional: call on shutdown if you want graceful close
export async function disconnectDB() {
  if (!client) return;
  await client.close();
  client = undefined;
  db = undefined;
  console.log("🛑 Disconnected from MongoDB");
}
