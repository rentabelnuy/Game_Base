// Same tile pool as frontend BASE_TILES (expanded)
const BASE_TILES = [1,1,2,2,3,3,5,5,7,7,10,10,15,15,25,25,50,75,100];

// Different tile selection strategies for variety
const aggressiveSelection = (availableTiles) => {
  // Always goes for highest value tiles (80% chance)
  const highValueTiles = availableTiles.filter(t => t >= 25);
  if (highValueTiles.length > 0 && Math.random() < 0.8) {
    const sorted = [...highValueTiles].sort((a, b) => b - a);
    return sorted[0] || availableTiles[Math.floor(Math.random() * availableTiles.length)];
  }
  return availableTiles[Math.floor(Math.random() * availableTiles.length)];
};

const conservativeSelection = (availableTiles) => {
  // Prefers mid-range tiles (5-25) to avoid collisions
  const midTiles = availableTiles.filter(t => t >= 5 && t <= 25);
  if (midTiles.length > 0 && Math.random() < 0.7) {
    return midTiles[Math.floor(Math.random() * midTiles.length)];
  }
  return availableTiles[Math.floor(Math.random() * availableTiles.length)];
};

const balancedSelection = (availableTiles) => {
  // Mix of high and mid tiles, sometimes avoids highest
  const highTiles = availableTiles.filter(t => t >= 25);
  const midTiles = availableTiles.filter(t => t >= 7 && t < 25);
  
  const rand = Math.random();
  if (rand < 0.5 && highTiles.length > 0) {
    // 50% chance for high tiles, but not always the absolute highest
    const sorted = [...highTiles].sort((a, b) => b - a);
    // Sometimes skip the highest to avoid collisions
    if (sorted.length > 1 && Math.random() < 0.4) {
      return sorted[1]; // Second highest
    }
    return sorted[0];
  } else if (rand < 0.8 && midTiles.length > 0) {
    // 30% chance for mid tiles
    return midTiles[Math.floor(Math.random() * midTiles.length)];
  }
  // 20% chance for completely random
  return availableTiles[Math.floor(Math.random() * availableTiles.length)];
};

const randomSelection = (availableTiles) => {
  // Completely random selection
  return availableTiles[Math.floor(Math.random() * availableTiles.length)];
};

// Multiple bot instances with different strategies for variety
export const BOTS = {
  BOT_ALPHA: {
    id: "BOT_ALPHA",
    name: "Bot Alpha",
    rps: () => ["ROCK","PAPER","SCISSORS"][Math.floor(Math.random()*3)],
    tile: (availableTiles) => {
      if (!availableTiles || availableTiles.length === 0) {
        return BASE_TILES[Math.floor(Math.random()*BASE_TILES.length)];
      }
      return aggressiveSelection(availableTiles); // Aggressive - goes for highest
    }
  },
  BOT_BETA: {
    id: "BOT_BETA",
    name: "Bot Beta",
    rps: () => ["ROCK","PAPER","SCISSORS"][Math.floor(Math.random()*3)],
    tile: (availableTiles) => {
      if (!availableTiles || availableTiles.length === 0) {
        return BASE_TILES[Math.floor(Math.random()*BASE_TILES.length)];
      }
      return conservativeSelection(availableTiles); // Conservative - avoids high collisions
    }
  },
  BOT_GAMMA: {
    id: "BOT_GAMMA",
    name: "Bot Gamma",
    rps: () => ["ROCK","PAPER","SCISSORS"][Math.floor(Math.random()*3)],
    tile: (availableTiles) => {
      if (!availableTiles || availableTiles.length === 0) {
        return BASE_TILES[Math.floor(Math.random()*BASE_TILES.length)];
      }
      return balancedSelection(availableTiles); // Balanced - mix of strategies
    }
  }
};

// Additional strategy for more bots (if we add more later)
const smartTileSelection = balancedSelection; // Fallback to balanced

// Default bot (for backward compatibility)
export const BOT = BOTS.BOT_ALPHA;

// Random nicknames for bots
const BOT_NICKNAMES = [
  "ShadowStrike", "NovaBlade", "VortexKing", "ThunderFist", "CrimsonFury",
  "IceStorm", "FireStorm", "DarkKnight", "SilverWolf", "CyberViper",
  "PhantomReaper", "SteelDragon", "BlazeRunner", "FrostBite", "VoidSeeker",
  "IronHawk", "LightningBolt", "NightShade", "CosmicRider", "DemonSlayer",
  "SwiftArrow", "EchoStrike", "RazorEdge", "TitaniumGuard", "NeonBlade",
  "StormBreaker", "VenomStrike", "CrystalShard", "MysticWarrior", "QuantumLeap"
];

// Get a random nickname that hasn't been used
export const getRandomNickname = (usedNames = []) => {
  const available = BOT_NICKNAMES.filter(name => !usedNames.includes(name));
  if (available.length === 0) {
    // If all names used, generate a unique one
    return `Bot_${Math.random().toString(36).substring(7)}`;
  }
  return available[Math.floor(Math.random() * available.length)];
};

// Get random bot with a unique nickname
export const getRandomBot = (nickname = null) => {
  const botKeys = Object.keys(BOTS);
  const baseBot = BOTS[botKeys[Math.floor(Math.random() * botKeys.length)]];
  
  // Return bot with nickname attached (nickname will be stored separately in game state)
  return {
    ...baseBot,
    nickname: nickname || getRandomNickname()
  };
};
