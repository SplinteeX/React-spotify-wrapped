// data/questsData.js
// Static quest definitions that can be seeded into MongoDB.

export const Quests = [
  {
    quest_id: "recent-10-tracks",
    title: "Session Starter",
    description: "Listen to 10 tracks in your recent history.",
    period: "weekly",
    type: "listen",
    reward_points: 250,
  },
  {
    quest_id: "recent-25-tracks",
    title: "Deep Listener",
    description: "Listen to 25 tracks in your recent history.",
    period: "weekly",
    type: "listen",
    reward_points: 500,
  },
  {
    quest_id: "unique-artists-5",
    title: "New Voices",
    description: "Listen to tracks from 5 different artists recently.",
    period: "weekly",
    type: "listen",
    reward_points: 400,
  },
  {
    quest_id: "top-tracks-25",
    title: "Wrapped Marathon",
    description: "Play at least 25 of your top tracks.",
    period: "monthly",
    type: "listen",
    reward_points: 800,
  },
  {
    quest_id: "top-tracks-50",
    title: "All‑Time Marathon",
    description: "Play at least 50 of your top tracks.",
    period: "monthly",
    type: "listen",
    reward_points: 1400,
  },
];

