import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not defined");

const client = new MongoClient(uri);
let db;

export async function connectDB() {
  if (db) return db; // already connected

  await client.connect();
  db = client.db("Wrapped-data"); // <-- MUST match Atlas
  console.log(`✅ MongoDB connected to DB: ${db.databaseName}`);
  return db;
}

export function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
}

export function getUsersCollection() {
  return getDB().collection("Users"); // <-- MUST match Atlas (case-sensitive)
}
