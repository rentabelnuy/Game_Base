// Enhanced player stats tracking
const playerStats = {};

export const recordScore = (addr, score) => {
  if (!playerStats[addr]) {
    playerStats[addr] = {
      address: addr,
      bestScore: 0,
      totalScore: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      badges: []
    };
  }
  
  const stats = playerStats[addr];
  stats.bestScore = Math.max(stats.bestScore, score);
  stats.totalScore += score;
  stats.gamesPlayed += 1;
  
  return stats;
};

export const recordGameResult = (addr, won, finalScore) => {
  if (!playerStats[addr]) {
    recordScore(addr, finalScore);
  }
  
  const stats = playerStats[addr];
  if (won) {
    stats.wins += 1;
  } else {
    stats.losses += 1;
  }
  
  return stats;
};

export const getPlayerStats = (addr) => {
  return playerStats[addr] || {
    address: addr,
    bestScore: 0,
    totalScore: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    badges: []
  };
};

export function getLeaderboard(req, res) {
  const { sortBy = "bestScore", limit = 100 } = req.query;
  
  let leaderboard = Object.values(playerStats)
    .filter(p => p.gamesPlayed > 0)
    .map(p => ({
      ...p,
      winRate: p.gamesPlayed > 0 ? (p.wins / p.gamesPlayed * 100).toFixed(1) : 0,
      avgScore: p.gamesPlayed > 0 ? (p.totalScore / p.gamesPlayed).toFixed(1) : 0
    }));
  
  // Sort by different criteria
  if (sortBy === "bestScore") {
    leaderboard.sort((a, b) => b.bestScore - a.bestScore);
  } else if (sortBy === "wins") {
    leaderboard.sort((a, b) => b.wins - a.wins);
  } else if (sortBy === "winRate") {
    leaderboard.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  } else if (sortBy === "gamesPlayed") {
    leaderboard.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  }
  
  res.json(leaderboard.slice(0, parseInt(limit)));
}
