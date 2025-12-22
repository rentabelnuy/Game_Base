import { v4 as uuid } from "uuid";
import { BOT, BOTS, getRandomBot, getRandomNickname } from "./bot.js";

const waiting = [];
const games = new Map();
const BOTS_PER_GAME = 5; // Number of bots to add if no real opponents (total 6 players including human)

export function joinLobby(req, res) {
  const { address } = req.body;

  if (waiting.length) {
    const opponent = waiting.pop();
    const gameId = uuid();
    games.set(gameId, { 
      players: [address, opponent], 
      bot: false,
      bots: [],
      scores: { [address]: 0, [opponent]: 0 },
      eliminated: [],
      currentRound: 1,
      rpsChoices: {}, // { address: "ROCK" | "PAPER" | "SCISSORS" }
      tileSelections: {}, // { address: tileValue }
      roundComplete: false
    });
    return res.json({ gameId, opponent });
  }

  // No real opponents, add multiple bots
  const gameId = uuid();
  const botPlayers = [];
  const botScores = {};
  const botNames = {}; // Store bot nicknames: { botId: nickname }
  const botTypes = {}; // Store bot base types: { botId: "BOT_ALPHA" | "BOT_BETA" | "BOT_GAMMA" }
  const usedNicknames = []; // Track used nicknames to ensure uniqueness
  
  // Add multiple bots with unique nicknames and unique IDs
  for (let i = 0; i < BOTS_PER_GAME; i++) {
    const nickname = getRandomNickname(usedNicknames);
    usedNicknames.push(nickname);
    const baseBot = getRandomBot(nickname);
    
    // Create unique bot ID for this instance (even if same bot type)
    const uniqueBotId = `${baseBot.id}_${i}_${uuid()}`;
    botPlayers.push(uniqueBotId);
    botScores[uniqueBotId] = 0;
    botNames[uniqueBotId] = nickname;
    botTypes[uniqueBotId] = baseBot.id; // Store the base bot type for tile selection
  }
  
  const allPlayers = [address, ...botPlayers];
  const allScores = { [address]: 0, ...botScores };
  
  games.set(gameId, { 
    players: allPlayers,
    bot: true,
    bots: botPlayers,
    botNames: botNames, // Store bot nicknames
    botTypes: botTypes, // Store bot base types for tile selection
    scores: allScores,
    eliminated: [],
    currentRound: 1,
    rpsChoices: {}, // RPS chosen once at game start
    tileSelections: {},
    roundComplete: false,
    availableTiles: [] // Current round's available tiles
  });
  
  res.json({ 
    gameId, 
    opponent: `BOT (${BOTS_PER_GAME} bots)`,
    botCount: BOTS_PER_GAME
  });
}

export const getGame = id => games.get(id);
