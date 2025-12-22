import { api } from "./utils/apiClient.js";

// Game endpoints
export const submitRPS = (payload) => api.post("/round/rps", payload);

export const submitTile = (payload) => api.post("/round/tile", payload);

export const joinLobby = (address) => api.post("/lobby/join", { address });

// Leaderboard endpoints
export const getLeaderboard = (sortBy = "bestScore", limit = 100) =>
  api.get(`/leaderboard?sortBy=${sortBy}&limit=${limit}`);

export const getPlayerStats = (address) => api.get(`/player/${address}/stats`);

// Badge endpoints
export const getPlayerBadges = (address) => api.get(`/badge/${address}`);

export const claimBadge = (payload) => api.post("/badge/claim", payload);

/**
 * Share to Farcaster/Warpcast
 */
export const shareToFarcaster = (data) => {
  const { score, result, badges, rank, gameResult } = data;
  
  let text = `⚔️ Battle Arena\n`;
  text += `A competitive on-chain game on Base\n\n`;
  
  if (gameResult) {
    text += `${gameResult === "win" ? "🏆 Victory!" : gameResult === "lose" ? "💀 Defeat" : "🤝 Draw"}\n`;
  }
  
  if (score !== undefined) {
    text += `Score: ${score} points\n`;
  }
  
  if (rank) {
    text += `Rank: #${rank} on leaderboard\n`;
  }
  
  if (badges && badges.length > 0) {
    text += `\n🏅 Badges earned: ${badges.map(b => b.emoji || "🏅").join(" ")}`;
  }
  
  text += `\n\nPlay now: ${window.location.origin}`;
  text += `\n\n#BattleArena #Base #OnChainGames`;
  
  window.open(
    `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
  );
};

/**
 * Share to Twitter/X (for Base app)
 */
export const shareToTwitter = (data) => {
  const { score, result, badges, rank, gameResult } = data;
  
  let text = `⚔️ Just played Battle Arena on @base!\n\n`;
  
  if (gameResult) {
    text += `${gameResult === "win" ? "🏆" : gameResult === "lose" ? "💀" : "🤝"} `;
  }
  
  if (score !== undefined) {
    text += `Score: ${score} points`;
  }
  
  if (rank) {
    text += ` | Rank: #${rank}`;
  }
  
  if (badges && badges.length > 0) {
    text += `\n\n🏅 Earned ${badges.length} badge${badges.length > 1 ? "s" : ""}!`;
  }
  
  const url = window.location.origin;
  const hashtags = "Base,BattleArena,Web3Gaming";
  
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`
  );
};

/**
 * Share badge NFT to Base NFT marketplace
 */
export const shareBadgeToBase = (badgeId, contractAddress) => {
  const baseScanUrl = `https://basescan.org/token/${contractAddress}?a=${badgeId}`;
  window.open(baseScanUrl, "_blank");
};

/**
 * Copy share link to clipboard
 */
export const copyShareLink = async (data) => {
  const { score, rank, gameResult } = data;
  
  let text = `⚔️ Battle Arena\n`;
  if (gameResult) text += `${gameResult === "win" ? "🏆 Victory!" : "💀 Defeat"}\n`;
  if (score !== undefined) text += `Score: ${score} points\n`;
  if (rank) text += `Rank: #${rank}\n`;
  text += `\n${window.location.origin}`;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
};
