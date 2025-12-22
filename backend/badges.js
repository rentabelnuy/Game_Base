// Rarity tiers: COMMON, RARE, EPIC, LEGENDARY
export const RARITY = {
  COMMON: { name: "Common", color: "#94a3b8", glow: "#94a3b8", gradient: ["#475569", "#64748b"] },
  RARE: { name: "Rare", color: "#38bdf8", glow: "#38bdf8", gradient: ["#0ea5e9", "#0284c7"] },
  EPIC: { name: "Epic", color: "#a78bfa", glow: "#a78bfa", gradient: ["#8b5cf6", "#7c3aed"] },
  LEGENDARY: { name: "Legendary", color: "#fbbf24", glow: "#fbbf24", gradient: ["#f59e0b", "#d97706"] }
};

export const BADGES = [
  { 
    id: "rookie", 
    name: "Rookie Fighter",
    description: "Score at least 5 points in a game",
    min: 5,
    emoji: "🥊",
    color: "#94a3b8",
    rarity: RARITY.COMMON
  },
  { 
    id: "fighter", 
    name: "Skilled Fighter",
    description: "Score at least 25 points in a game",
    min: 25,
    emoji: "⚔️",
    color: "#38bdf8",
    rarity: RARITY.RARE
  },
  { 
    id: "champion", 
    name: "Battle Champion",
    description: "Score at least 100 points in a game",
    min: 100,
    emoji: "🏆",
    color: "#fbbf24",
    rarity: RARITY.EPIC
  },
  { 
    id: "legend", 
    name: "Legendary Warrior",
    description: "Score at least 200 points in a game",
    min: 200,
    emoji: "👑",
    color: "#a78bfa",
    rarity: RARITY.LEGENDARY
  },
  { 
    id: "first_win", 
    name: "First Victory",
    description: "Win your first game",
    min: 0,
    emoji: "🎯",
    type: "achievement",
    color: "#22c55e",
    rarity: RARITY.RARE
  },
  { 
    id: "win_streak_3", 
    name: "Hot Streak",
    description: "Win 3 games in a row",
    min: 0,
    emoji: "🔥",
    type: "achievement",
    color: "#fb7185",
    rarity: RARITY.EPIC
  },
  { 
    id: "survivor", 
    name: "Survivor",
    description: "Win a game without being eliminated",
    min: 0,
    emoji: "🛡️",
    type: "achievement",
    color: "#7c3aed",
    rarity: RARITY.EPIC
  },
  { 
    id: "veteran", 
    name: "Veteran",
    description: "Play 10 games",
    min: 0,
    emoji: "🎖️",
    type: "achievement",
    color: "#6366f1",
    rarity: RARITY.RARE
  }
];

export const getBadgesForScore = (score) => {
  return BADGES.filter(b => b.min > 0 && score >= b.min);
};

export const getBadgeById = (id) => {
  return BADGES.find(b => b.id === id);
};
