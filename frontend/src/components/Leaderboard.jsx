import { useEffect, useState } from "react";
import { getLeaderboard } from "../api";
import { ApiError } from "../utils/apiClient.js";

export default function Leaderboard({ currentAddress }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState("bestScore");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(sortBy, 50);
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      const message = error instanceof ApiError 
        ? error.message 
        : "Failed to load leaderboard. Please try again.";
      alert(message);
      setLeaderboard([]); // Clear leaderboard on error
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "Unknown";
    if (addr === "BOT_ALPHA") return "🤖 Bot";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankEmoji = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  return (
    <div className="card">
      <h2>🏆 Leaderboard</h2>
      
      <div className="sort-buttons">
        <button
          className={sortBy === "bestScore" ? "btn-primary" : "btn-secondary"}
          onClick={() => setSortBy("bestScore")}
        >
          Best Score
        </button>
        <button
          className={sortBy === "wins" ? "btn-primary" : "btn-secondary"}
          onClick={() => setSortBy("wins")}
        >
          Wins
        </button>
        <button
          className={sortBy === "winRate" ? "btn-primary" : "btn-secondary"}
          onClick={() => setSortBy("winRate")}
        >
          Win Rate
        </button>
        <button
          className={sortBy === "gamesPlayed" ? "btn-primary" : "btn-secondary"}
          onClick={() => setSortBy("gamesPlayed")}
        >
          Games
        </button>
      </div>

      {loading ? (
        <p className="hint">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p className="hint">No players yet. Be the first!</p>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((player, index) => (
            <div
              key={player.address}
              className={`leaderboard-item ${
                currentAddress && player.address === currentAddress ? "current-player" : ""
              }`}
            >
              <div className="rank">{getRankEmoji(index)}</div>
              <div className="player-info">
                <div className="player-name">
                  {formatAddress(player.address)}
                  {currentAddress && player.address === currentAddress && " (You)"}
                </div>
                <div className="player-stats">
                  {sortBy === "bestScore" && (
                    <>
                      <span>Best: {player.bestScore}</span>
                      <span>Games: {player.gamesPlayed}</span>
                    </>
                  )}
                  {sortBy === "wins" && (
                    <>
                      <span>Wins: {player.wins}</span>
                      <span>Win Rate: {player.winRate}%</span>
                    </>
                  )}
                  {sortBy === "winRate" && (
                    <>
                      <span>Win Rate: {player.winRate}%</span>
                      <span>Wins: {player.wins}/{player.gamesPlayed}</span>
                    </>
                  )}
                  {sortBy === "gamesPlayed" && (
                    <>
                      <span>Games: {player.gamesPlayed}</span>
                      <span>Wins: {player.wins}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="player-score">
                {sortBy === "bestScore" ? player.bestScore : 
                 sortBy === "wins" ? player.wins :
                 sortBy === "winRate" ? `${player.winRate}%` :
                 player.gamesPlayed}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




