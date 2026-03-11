import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { joinLobby } from "./matchmaking.js";
import { submitRPS, submitTile } from "./rounds.js";
import { getLeaderboard, getPlayerStats } from "./leaderboard.js";
import { issueBadge, getPlayerBadges } from "./badgeEngine.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15000, max: 40 }));

app.get("/", (_req, res) => {
  res.json({
    service: "battle-arena-backend",
    status: "ok",
    health: "/health",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/webhook/farcaster", (req, res) => {
  console.log("Farcaster webhook event", req.body);
  res.status(200).json({ ok: true });
});

app.post("/lobby/join", joinLobby);
app.post("/round/rps", submitRPS);
app.post("/round/tile", submitTile);
app.get("/leaderboard", getLeaderboard);
app.get("/player/:address/stats", (req, res) => {
  res.json(getPlayerStats(req.params.address));
});
app.post("/badge/claim", issueBadge);
app.get("/badge/:address", getPlayerBadges);

app.listen(port, () => {
  console.log(`Battle Arena backend running on port ${port}`);
});
