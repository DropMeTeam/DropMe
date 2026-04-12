import { api } from "./api";

// Logged-in user eco stats
export async function getMyEcoStats() {
  const { data } = await api.get("/api/eco/me");
  return data;
}

// Public leaderboard
export async function getEcoLeaderboard({ period = "month", limit = 20 } = {}) {
  const { data } = await api.get("/api/eco/leaderboard", {
    params: { period, limit },
  });
  return data;
}