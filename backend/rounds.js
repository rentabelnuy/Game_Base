import { getGame } from "./matchmaking.js";
import { BOT, BOTS, pickBotTileForRound } from "./bot.js";
import { recordScore, recordGameResult } from "./leaderboard.js";

// Submit RPS choice
export function submitRPS(req, res) {
  const { gameId, address, rps } = req.body;
  const game = getGame(gameId);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  if (game.eliminated.includes(address)) {
    return res.status(400).json({ error: "Player is eliminated" });
  }

  // Store RPS choice
  game.rpsChoices[address] = rps;

  // If bot game, make all bots' RPS choices immediately
  if (game.bot && game.bots) {
    game.bots.forEach(botId => {
      if (!game.rpsChoices[botId]) {
        // Get base bot type for this bot instance
        const baseBotType = (game.botTypes && game.botTypes[botId]) || botId;
        const bot = BOTS[baseBotType] || BOT;
        game.rpsChoices[botId] = bot.rps();
      }
    });
  } else if (game.bot) {
    // Legacy single bot support
    if (!game.rpsChoices[BOT.id]) {
      game.rpsChoices[BOT.id] = BOT.rps();
    }
  }

  // Check if all active players have chosen RPS
  const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
  const allChosen = activePlayers.every(p => game.rpsChoices[p] !== undefined && game.rpsChoices[p] !== null);

  // Build bot info for bot games
  let botsInfo = [];
  if (game.bot && game.bots) {
    botsInfo = game.bots.map(botId => ({
      id: botId,
      name: (game.botNames && game.botNames[botId]) || botId,
      score: game.scores[botId] || 0,
      eliminated: game.eliminated.includes(botId)
    }));
  }

  res.json({ 
    rpsSubmitted: true,
    allPlayersReady: allChosen,
    opponentRps: game.bot && game.rpsChoices[BOT.id] ? game.rpsChoices[BOT.id] : null,
    botsInfo: game.bot ? botsInfo : undefined
  });
}

// Submit tile selection
export function submitTile(req, res) {
  const { gameId, address, tile, availableTiles } = req.body;
  const game = getGame(gameId);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  if (game.eliminated.includes(address)) {
    return res.status(400).json({ error: "Player is eliminated" });
  }

  if (!game.rpsChoices[address]) {
    return res.status(400).json({ error: "Must choose RPS first" });
  }

  // Store available tiles for this round (for bot selection)
  if (availableTiles && availableTiles.length > 0) {
    game.availableTiles = availableTiles;
  } else {
    // Fallback: use a default tile set if not provided
    game.availableTiles = [1,1,2,2,3,3,5,5,7,7,10,10,15,15,25,25,50,75,100];
  }

  // Store tile selection
  game.tileSelections[address] = tile;

  // If bot game, make all bots' tile selections immediately with collision-avoidance.
  if (game.bot) {
    const botsToSelect = game.bots && game.bots.length > 0 ? game.bots : (game.bot ? [BOT.id] : []);
    const reservedTiles = new Set([tile]);

    botsToSelect.forEach(botId => {
      const isEliminated = game.eliminated.includes(botId);
      const hasSelected = game.tileSelections[botId] !== undefined && game.tileSelections[botId] !== null;

      if (!isEliminated && !hasSelected) {
        const baseBotType = (game.botTypes && game.botTypes[botId]) || botId;
        const bot = BOTS[baseBotType] || BOT;
        const selectedTile = pickBotTileForRound(bot, game.availableTiles || [], reservedTiles);
        game.tileSelections[botId] = selectedTile;
        reservedTiles.add(selectedTile);
      }
    });
  }

  // Check if all active players have selected tiles
  const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
  const allSelected = activePlayers.every(p => {
    const hasSelection = game.tileSelections[p] !== undefined && game.tileSelections[p] !== null;
    return hasSelection;
  });
  

  // Process if all selected (for non-bot games or if check passed)
  if (allSelected) {
    return processRound(game, address, res);
  }

  res.json({ 
    tileSubmitted: true,
    allPlayersReady: false,
    activePlayers: activePlayers.length,
    selectionsCount: Object.keys(game.tileSelections).length,
    debug: {
      bot: game.bot,
      bots: game.bots,
      eliminated: game.eliminated,
      selections: game.tileSelections
    }
  });
}

function processRound(game, address, res) {
  const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
  
  // Group players by selected tile
  const tileGroups = {};
  activePlayers.forEach(player => {
    const tile = game.tileSelections[player];
    if (!tileGroups[tile]) {
      tileGroups[tile] = [];
    }
    tileGroups[tile].push(player);
  });

  // Process each tile group
  const roundResults = {};
  const newEliminations = [];
  const tileWinners = []; // Track who won each tile: [{ tile: 50, winner: "address", winnerName: "Player Name", collision: true }]

  Object.entries(tileGroups).forEach(([tileValue, players]) => {
    const tile = parseInt(tileValue);
    
    if (players.length === 1) {
      // No collision - player gets points
      const player = players[0];
      game.scores[player] = (game.scores[player] || 0) + tile;
      roundResults[player] = {
        tile,
        points: tile,
        collision: false,
        eliminated: false
      };
      
      // Track winner
      const winnerName = player === address ? "You" : (game.botNames && game.botNames[player] ? game.botNames[player] : player);
      tileWinners.push({
        tile,
        winner: player,
        winnerName,
        collision: false
      });
    } else {
      // Collision - resolve with RPS
      const winner = resolveRPSBattle(players, game.rpsChoices);
      const losers = players.filter(p => p !== winner);
      
      // Winner gets points
      game.scores[winner] = (game.scores[winner] || 0) + tile;
      roundResults[winner] = {
        tile,
        points: tile,
        collision: true,
        eliminated: false,
        opponents: losers
      };
      
      // Track winner
      const winnerName = winner === address ? "You" : (game.botNames && game.botNames[winner] ? game.botNames[winner] : winner);
      tileWinners.push({
        tile,
        winner,
        winnerName,
        collision: true,
        eliminatedPlayers: losers.map(l => ({
          player: l,
          name: l === address ? "You" : (game.botNames && game.botNames[l] ? game.botNames[l] : l)
        }))
      });
      
      // Losers are eliminated
      losers.forEach(loser => {
        game.eliminated.push(loser);
        newEliminations.push(loser);
        roundResults[loser] = {
          tile,
          points: 0,
          collision: true,
          eliminated: true,
          opponent: winner
        };
      });
    }
  });

  // Record scores for leaderboard
  activePlayers.forEach(player => {
    if (!game.eliminated.includes(player)) {
      recordScore(player, game.scores[player]);
    }
  });
  
  // Record game results if game is over
  const gameOver = game.eliminated.length >= game.players.length - 1 || game.currentRound >= 5;
  let finalWinner = null;
  if (gameOver) {
    // Determine winner (highest score)
    const finalScores = activePlayers.map(p => ({
      player: p,
      score: game.scores[p] || 0
    })).sort((a, b) => b.score - a.score);
    
    const winner = finalScores[0]?.player;
    if (winner) {
      const winnerName = winner === address ? "You" : (game.botNames && game.botNames[winner] ? game.botNames[winner] : winner);
      finalWinner = {
        player: winner,
        name: winnerName,
        score: finalScores[0].score
      };
    }
    
    activePlayers.forEach(player => {
      const won = player === winner && finalScores[0].score > (finalScores[1]?.score || 0);
      recordGameResult(player, won, game.scores[player] || 0);
    });
  }

  // Get player's result
  const playerResult = roundResults[address] || {
    tile: game.tileSelections[address],
    points: 0,
    collision: false,
    eliminated: false
  };

  // Check if player is eliminated
  const eliminated = newEliminations.includes(address);

  // Reset for next round (only if game not over)
  // Keep RPS choices - they're used for the entire game
  if (!gameOver) {
    game.tileSelections = {};
    game.availableTiles = []; // Clear for next round
    game.currentRound += 1;
  }

  // Calculate opponent score (sum of active bots only) and build bot info
  let opponentScore = 0;
  let botsInfo = [];
  
  if (game.bot && game.bots) {
    // Multiple bots - sum only active (non-eliminated) bots
    botsInfo = game.bots.map(botId => {
      const isEliminated = game.eliminated.includes(botId);
      const botScore = game.scores[botId] || 0;
      const botName = (game.botNames && game.botNames[botId]) || botId;
      
      // Only count active bots in opponent score
      if (!isEliminated) {
        opponentScore += botScore;
      }
      
      return {
        id: botId,
        name: botName,
        score: botScore,
        eliminated: isEliminated
      };
    });
  } else if (game.bot) {
    // Single bot (legacy)
    const isEliminated = game.eliminated.includes(BOT.id);
    opponentScore = isEliminated ? 0 : (game.scores[BOT.id] || 0);
    botsInfo = [{
      id: BOT.id,
      name: (game.botNames && game.botNames[BOT.id]) || BOT.name,
      score: game.scores[BOT.id] || 0,
      eliminated: isEliminated
    }];
  } else {
    // Real opponent
    const opponent = game.players.find(p => p !== address && !game.eliminated.includes(p));
    opponentScore = opponent ? (game.scores[opponent] || 0) : 0;
  }

  const response = {
    roundComplete: true,
    result: playerResult,
    cumulativeScore: game.scores[address] || 0,
    opponentScore,
    eliminated,
    allResults: roundResults,
    currentRound: game.currentRound,
    gameOver,
    tileWinners: tileWinners.sort((a, b) => b.tile - a.tile) // Sort by tile value descending
  };
  
  // Always include botsInfo for bot games, even if empty (shouldn't happen but be safe)
  if (game.bot) {
    response.botsInfo = botsInfo || [];
  }
  
  // Include final winner if game is over
  if (gameOver && finalWinner) {
    response.finalWinner = finalWinner;
  }
  
  res.json(response);
}

function resolveRPSBattle(players, rpsChoices) {
  if (players.length === 1) return players[0];

  const choices = players.map(p => ({ player: p, choice: rpsChoices[p] }));
  const byChoice = {
    ROCK: choices.filter(c => c.choice === "ROCK").map(c => c.player),
    PAPER: choices.filter(c => c.choice === "PAPER").map(c => c.player),
    SCISSORS: choices.filter(c => c.choice === "SCISSORS").map(c => c.player)
  };

  const hasRock = byChoice.ROCK.length > 0;
  const hasPaper = byChoice.PAPER.length > 0;
  const hasScissors = byChoice.SCISSORS.length > 0;

  let candidates = players;
  if (hasRock && hasScissors && !hasPaper) {
    candidates = byChoice.ROCK;
  } else if (hasPaper && hasRock && !hasScissors) {
    candidates = byChoice.PAPER;
  } else if (hasScissors && hasPaper && !hasRock) {
    candidates = byChoice.SCISSORS;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

