// config/database.js - Database configuration only
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI in environment");

let client;
let db;

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

  return db;
}

export function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
}

export async function disconnectDB() {
  if (!client) return;
  await client.close();
  client = undefined;
  db = undefined;
  console.log("🛑 Disconnected from MongoDB");
}
