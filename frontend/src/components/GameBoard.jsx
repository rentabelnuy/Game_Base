import { useEffect, useState, useRef, useCallback } from "react";
import { joinLobby, submitRPS, submitTile, getLeaderboard, shareToTwitter, copyShareLink } from "../api";
import { ApiError } from "../utils/apiClient.js";
import BadgeDisplay from "./BadgeDisplay";

const PHASES = {
  RPS: "RPS",
  TILES: "TILES",
  RESULT: "RESULT",
  ELIMINATED: "ELIMINATED",
  GAME_OVER: "GAME_OVER"
};

// Expanded tile pool with more variety
const BASE_TILES = [1,1,2,2,3,3,5,5,7,7,10,10,15,15,25,25,50,75,100];
const MAX_ROUNDS = 5;
const TILES_PER_ROUND = 12; // Number of tiles to show per round

const shuffle = (arr) =>
  [...arr].sort(() => Math.random() - 0.5);

// No longer needed - using CSS grid instead

export default function GameBoard({ address }) {
  const [myScore, setMyScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  const [gameId, setGameId] = useState(null);
  const [phase, setPhase] = useState(PHASES.RPS);
  const [rps, setRps] = useState(null);
  const [rpsSubmitted, setRpsSubmitted] = useState(false);
  const [tiles, setTiles] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [round, setRound] = useState(0); // Start at 0, increment after round completes
  const [roundResult, setRoundResult] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [playerRank, setPlayerRank] = useState(null);
  const [gameStarted, setGameStarted] = useState(false); // Track if game has started
  const [botsInfo, setBotsInfo] = useState([]); // Array of { id, name, score, eliminated }
  const [aggregatedTileWinners, setAggregatedTileWinners] = useState(new Map()); // Map of winner -> { name, totalPoints, rounds: [{ round, tile, collision, eliminatedPlayers }] }
  const pollingIntervalRef = useRef(null); // Store interval for cleanup

  const startNewBattle = useCallback(async () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setMyScore(0);
    setEnemyScore(0);
    setGameId(null);
    setPhase(PHASES.RPS);
    setRps(null);
    setRpsSubmitted(false);
    setTiles([]);
    setSelectedTile(null);
    setRound(0);
    setRoundResult(null);
    setWaitingForOpponent(false);
    setPlayerRank(null);
    setGameStarted(false);
    setBotsInfo([]);
    setAggregatedTileWinners(new Map());

    try {
      const res = await joinLobby(address);
      setGameId(res.gameId);
    } catch (error) {
      console.error("Failed to join lobby:", error);
      const message = error instanceof ApiError
        ? error.message
        : "Failed to join game. Please refresh and try again.";
      alert(message);
    }
  }, [address]);

  // Join lobby on mount
  useEffect(() => {
    startNewBattle();
    // Don't load leaderboard on mount - only after round 1 completes
  }, [startNewBattle]);

  const loadPlayerRank = async () => {
    try {
      const leaderboard = await getLeaderboard("bestScore", 1000);
      const rank = leaderboard.findIndex(p => p.address === address) + 1;
      if (rank > 0) {
        setPlayerRank(rank);
      }
    } catch (error) {
      console.error("Failed to load rank:", error);
      // Silently fail for leaderboard - not critical for game flow
    }
  };

  // Initialize tiles when entering tile phase
  useEffect(() => {
    if (phase === PHASES.TILES) {
      // Shuffle and select random tiles for this round
      const shuffled = shuffle(BASE_TILES);
      const selectedTiles = shuffled.slice(0, TILES_PER_ROUND);
      setTiles(selectedTiles);
      setSelectedTile(null);
    }
  }, [phase]);

  // Submit RPS choice (only at game start)
  const handleRPSSelect = (selectedRps) => {
    if (!selectedRps || rpsSubmitted) return;
    setRps(selectedRps);
  };

  // Start game after RPS selection
  const handleStartGame = async () => {
    if (!rps || !gameId || rpsSubmitted) return;
    
    setRpsSubmitted(true);
    // Reset aggregated tile winners for new game
    setAggregatedTileWinners(new Map());
    
    try {
      const res = await submitRPS({
        gameId,
        address,
        rps
      });

      // Bot should respond immediately
      if (res.allPlayersReady) {
        setGameStarted(true);
        setWaitingForOpponent(false);
        // Store bot info if available
        if (res.botsInfo && Array.isArray(res.botsInfo) && res.botsInfo.length > 0) {
          setBotsInfo(res.botsInfo);
        }
        // Move to tiles phase
        setTimeout(() => {
          setPhase(PHASES.TILES);
        }, 500);
      } else {
        setWaitingForOpponent(true);
        setTimeout(async () => {
          const checkRes = await submitRPS({ gameId, address, rps });
          if (checkRes.allPlayersReady) {
            setGameStarted(true);
            setWaitingForOpponent(false);
            setPhase(PHASES.TILES);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Failed to submit RPS:", error);
      setRpsSubmitted(false);
      const message = error instanceof ApiError ? error.message : "Failed to start game. Please try again.";
      alert(message);
    }
  };

  // Cleanup polling on unmount or phase change
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [phase]);

  // Submit tile selection
  const handleTileSelect = useCallback(async (tile) => {
    if (!gameId || selectedTile !== null) return;
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setSelectedTile(tile);
    setWaitingForOpponent(true);
    
    try {
      const res = await submitTile({
        gameId,
        address,
        tile,
        availableTiles: tiles // Send available tiles to backend for bot selection
      });

      if (res.roundComplete) {
        // Round is complete, process results
        setRoundResult(res);
        setMyScore(res.cumulativeScore || 0);
        setEnemyScore(res.opponentScore || 0);
        setWaitingForOpponent(false);
        // Update bot info if available
        if (res.botsInfo !== undefined && Array.isArray(res.botsInfo)) {
          setBotsInfo(res.botsInfo);
        }
        
        // Aggregate tile winners across rounds
        if (res.tileWinners && Array.isArray(res.tileWinners)) {
          setAggregatedTileWinners(prev => {
            const newMap = new Map(prev);
            const currentRoundNum = res.currentRound || round + 1;
            
            res.tileWinners.forEach(winner => {
              const winnerId = winner.winner;
              if (!newMap.has(winnerId)) {
                newMap.set(winnerId, {
                  winner: winnerId,
                  name: winner.winnerName,
                  totalPoints: 0,
                  rounds: []
                });
              }
              const entry = newMap.get(winnerId);
              entry.totalPoints += winner.tile;
              entry.rounds.push({
                round: currentRoundNum,
                tile: winner.tile,
                collision: winner.collision || false,
                eliminatedPlayers: winner.eliminatedPlayers || []
              });
            });
            
            return newMap;
          });
        }
        
        // Refresh leaderboard only after round 1 completes (for mini leaderboard)
        if (res.currentRound >= 1) {
          loadPlayerRank();
        }
        
        if (res.eliminated) {
          setPhase(PHASES.ELIMINATED);
        } else if (res.gameOver) {
          setPhase(PHASES.GAME_OVER);
        } else {
          setPhase(PHASES.RESULT);
        }
      } else {
        // This shouldn't happen with bots (they respond immediately)
        // But keep polling as fallback for real opponents
        console.warn("Bots should have responded immediately. Starting fallback polling...");
        
        let pollCount = 0;
        const maxPolls = 10; // Reduced since bots should respond immediately
        const baseDelay = 1500; // Faster polling for bots
        
        const poll = async () => {
          pollCount++;
          console.log(`Polling attempt ${pollCount}/${maxPolls}`);
          
          try {
            // Re-submit with same tile to check status
            const checkRes = await submitTile({ 
              gameId, 
              address, 
              tile,
              availableTiles: tiles // Include available tiles in polling
            });
            
            if (checkRes.roundComplete) {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setRoundResult(checkRes);
              setMyScore(checkRes.cumulativeScore || 0);
              setEnemyScore(checkRes.opponentScore || 0);
              setWaitingForOpponent(false);
              // Update bot info if available
              if (checkRes.botsInfo && Array.isArray(checkRes.botsInfo) && checkRes.botsInfo.length > 0) {
                setBotsInfo(checkRes.botsInfo);
              }
              
              if (checkRes.eliminated) {
                setPhase(PHASES.ELIMINATED);
              } else if (checkRes.gameOver) {
                setPhase(PHASES.GAME_OVER);
              } else {
                setPhase(PHASES.RESULT);
              }
            } else if (pollCount >= maxPolls) {
              // Stop polling after max attempts
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setWaitingForOpponent(false);
              alert("Opponent is taking too long. Please refresh and try again.");
            }
          } catch (error) {
            console.error("Polling error:", error);
            if (pollCount >= maxPolls) {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setWaitingForOpponent(false);
              const message = error instanceof ApiError 
                ? error.message 
                : "Error checking game status. Please refresh and try again.";
              alert(message);
            }
          }
        };
        
        // Start polling with 1.5 second interval
        pollingIntervalRef.current = setInterval(poll, baseDelay);
      }
    } catch (error) {
      console.error("Failed to submit tile:", error);
      setWaitingForOpponent(false);
      setSelectedTile(null);
      const message = error instanceof ApiError ? error.message : "Failed to select tile. Please try again.";
      alert(message);
    }
  }, [gameId, address, tiles, selectedTile]);

  // Start next round (no RPS selection needed)
  const startNextRound = async () => {
    setRound(r => r + 1); // Increment round after completion
    setSelectedTile(null);
    setRoundResult(null);
    await loadPlayerRank();
    setPhase(PHASES.TILES); // Go directly to tiles, RPS already chosen
  };

  // Render compact bot list (for TILES phase)
  const renderBotsList = () => {
    if (!botsInfo || botsInfo.length === 0) return null;

    // Sort bots: active first (by score descending), then eliminated (by score descending)
    const sortedBots = [...botsInfo].sort((a, b) => {
      if (a.eliminated !== b.eliminated) {
        return a.eliminated ? 1 : -1; // Active bots first
      }
      return b.score - a.score; // Higher score first
    });

    return (
      <div className="bots-list">
        <h4 className="bots-list-header">🤖 Opponents</h4>
        <div className="bots-list-items">
          {sortedBots.map((bot) => (
            <div
              key={bot.id}
              className={`bot-item ${bot.eliminated ? 'eliminated' : ''}`}
            >
              <div className="bot-info">
                <span className="bot-icon">{bot.eliminated ? '💀' : '🤖'}</span>
                <span className="bot-name">{bot.name}</span>
                {bot.eliminated && <span className="bot-eliminated-label">(Elim)</span>}
              </div>
              <span className="bot-score">{bot.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!gameId) {
    return <div className="card">Matching opponent...</div>;
  }

  return (
    <div className="card">
      {/* 🪨✂️📄 RPS PHASE - Only at game start */}
      {phase === PHASES.RPS && !gameStarted && (
        <>
          <div className="game-info">
            <h2>Choose Your Weapon!</h2>
            <p><strong>Select Rock, Paper, or Scissors</strong></p>
            <p className="hint">⚠️ If multiple players select the same tile, you'll play RPS - loser is eliminated!</p>
            <p className="hint">This choice will be used for all rounds.</p>
          </div>

          <div className="rps-buttons">
            {[
              { value: "ROCK", emoji: "🪨", name: "Rock" },
              { value: "PAPER", emoji: "📄", name: "Paper" },
              { value: "SCISSORS", emoji: "✂️", name: "Scissors" }
            ].map(option =>
              <button
                key={option.value}
                className={`rps-button ${rps === option.value ? "active" : ""}`}
                onClick={() => handleRPSSelect(option.value)}
                disabled={rpsSubmitted}
              >
                <span className="rps-emoji">{option.emoji}</span>
                <span className="rps-name">{option.name}</span>
              </button>
            )}
          </div>

          {rps && !rpsSubmitted && (
            <button className="btn-primary" onClick={handleStartGame} style={{ marginTop: "20px" }}>
              🎮 Start Game
            </button>
          )}

          {waitingForOpponent && (
            <div className="waiting-indicator">
              <p className="hint">⏳ Starting game...</p>
            </div>
          )}
        </>
      )}

      {/* 🎲 TILE PHASE */}
      {phase === PHASES.TILES && (
        <>
          <div className="game-info tile-phase-info">
            <div className="game-header-compact">
              <h2 className="round-indicator">Round {round || 1} / {MAX_ROUNDS}</h2>
              <div className="score-badge">Score: {myScore}</div>
            </div>
            <p className="tile-phase-title"><strong>Select a Tile</strong></p>
            {waitingForOpponent && (
              <p className="hint" style={{ marginTop: '8px', marginBottom: '0' }}>⏳ Waiting for opponents...</p>
            )}
          </div>

          <div className="tiles-container">
            {tiles.map((t, i) => (
              <button
                key={`${t}-${i}`}
                className={`tile grid-tile ${selectedTile === t ? "selected" : ""}`}
                onClick={() => handleTileSelect(t)}
                disabled={selectedTile !== null || waitingForOpponent}
                data-value={t}
              >
                <span className="tile-value">{t}</span>
              </button>
            ))}
          </div>

          {renderBotsList()}
        </>
      )}

      {/* 🏆 RESULT PHASE */}
      {phase === PHASES.RESULT && roundResult && (
        <div className="result">
          <h2>
            {roundResult.result.collision && roundResult.result.eliminated 
              ? "💀 You Were Eliminated in a Collision!" 
              : roundResult.result.collision && !roundResult.result.eliminated
              ? `⚔️ Collision! You Won the RPS Battle and Got ${roundResult.result.points} Points!` 
              : roundResult.result.points > 0 
              ? `🎉 You Got ${roundResult.result.points} Points!` 
              : "🤝 No Points This Round"}
          </h2>
          
          <div className="score-display">
            <div className="score-item">
              <h4>Round {round} Results:</h4>
              <p>Tile Selected: {roundResult.result.tile}</p>
              <p>Points Earned: {roundResult.result.points}</p>
              {roundResult.result.collision && (
                <p className="collision-warning">
                  {roundResult.result.eliminated 
                    ? `You collided and lost the RPS battle!` 
                    : `You collided but won the RPS battle!`}
                </p>
              )}
            </div>
            <div className="score-item">
              <h4>Your Score: {myScore}</h4>
            </div>
          </div>

          {/* Tile Winners - Accumulated across all rounds */}
          {aggregatedTileWinners.size > 0 && (
            <div className="score-display" style={{ marginTop: '20px' }}>
              <div className="score-item" style={{ width: '100%' }}>
                <h4>🏆 Tile Winners:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {Array.from(aggregatedTileWinners.values())
                    .sort((a, b) => b.totalPoints - a.totalPoints) // Sort by total points descending
                    .map((entry) => (
                      <div
                        key={entry.winner}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: entry.winner === address ? 'rgba(76, 175, 80, 0.2)' : 'rgba(74, 158, 255, 0.1)',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${entry.winner === address ? '#4caf50' : '#4a9eff'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#fff', fontWeight: '600' }}>
                            {entry.name}
                          </span>
                          <span style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>
                            {entry.totalPoints} pts
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {round < MAX_ROUNDS ? (
            <button className="btn-primary" onClick={startNextRound}>
              Next Round
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setPhase(PHASES.GAME_OVER)}>
              View Final Results
            </button>
          )}
        </div>
      )}

      {/* ELIMINATED */}
      {phase === PHASES.ELIMINATED && (
        <div className="card danger">
          <h2>You Have Been Eliminated!</h2>
          <p>You collided with another player on the same tile and lost the Rock Paper Scissors battle.</p>
          <div className="score-display">
            <h3>Final Scores:</h3>
            <p>Your Final Score: {myScore}</p>
            <p>Opponent Final Score: {enemyScore}</p>
            <p className={myScore > enemyScore ? "winner" : "loser"}>
              {myScore > enemyScore ? "You Won!" : "You Lost"}
            </p>
          </div>
          <button className="btn-primary" onClick={startNewBattle} style={{ marginTop: "15px" }}>
            Restart Battle
          </button>
        </div>
      )}

      {/* GAME OVER */}
      {phase === PHASES.GAME_OVER && roundResult && (
        <>
          <div className="card">
            <h2>Game Over!</h2>
            <div className="score-display">
              <h3>Final Scores:</h3>
              <p><strong>Your Score: {myScore}</strong></p>
              {playerRank && (
                <p className="rank-display">Your Rank: #{playerRank}</p>
              )}
              {roundResult.finalWinner && (
                <div style={{
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: roundResult.finalWinner.player === address ? "rgba(76, 175, 80, 0.2)" : "rgba(74, 158, 255, 0.2)",
                  borderRadius: "8px",
                  border: `2px solid ${roundResult.finalWinner.player === address ? "#4caf50" : "#4a9eff"}`
                }}>
                  <h3 style={{ margin: "0 0 10px 0", color: "#fff" }}>Champion:</h3>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#fff" }}>
                    {roundResult.finalWinner.name}
                  </div>
                  <div style={{ fontSize: "18px", color: "#aaa", marginTop: "5px" }}>
                    Final Score: {roundResult.finalWinner.score} points
                  </div>
                </div>
              )}
              <div className={`final-result ${myScore > enemyScore ? "winner" : myScore < enemyScore ? "loser" : "draw"}`} style={{ marginTop: "20px" }}>
                {myScore > enemyScore && <h2>You Won!</h2>}
                {myScore < enemyScore && <h2>You Lost</h2>}
                {myScore === enemyScore && <h2>It's a Draw!</h2>}
              </div>
            </div>

            <div className="share-buttons">
              <h4>Share Your Battle:</h4>
              <div className="share-buttons-grid">
                <button
                  className="btn-primary"
                  onClick={() => shareToTwitter({
                    score: myScore,
                    gameResult: myScore > enemyScore ? "win" : myScore < enemyScore ? "lose" : "draw",
                    rank: playerRank
                  })}
                >
                  Share to Twitter/X
                </button>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    const copied = await copyShareLink({
                      score: myScore,
                      gameResult: myScore > enemyScore ? "win" : myScore < enemyScore ? "lose" : "draw",
                      rank: playerRank
                    });
                    if (copied) {
                      alert("Link copied to clipboard!");
                    }
                  }}
                >
                  Copy Link
                </button>
              </div>

              <button
                className="btn-primary"
                onClick={startNewBattle}
                style={{ marginTop: "15px" }}
              >
                Play Again
              </button>
            </div>
          </div>
          <BadgeDisplay address={address} score={myScore} />
        </>
      )}
    </div>
  );
}
