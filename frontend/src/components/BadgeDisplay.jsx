import { useEffect, useState } from "react";
import { getPlayerBadges, claimBadge } from "../api";
import { ApiError } from "../utils/apiClient.js";
import { 
  mintBadgeToWallet, 
  hasMintedBadge, 
  checkBaseNetwork, 
  switchToBaseNetwork,
  estimateMintGas,
  BADGE_IDS 
} from "../utils/contract";

// Rarity tiers matching backend
const RARITY = {
  COMMON: { name: "Common", color: "#94a3b8", glow: "#94a3b8", gradient: ["#475569", "#64748b"], icon: "⚪" },
  RARE: { name: "Rare", color: "#38bdf8", glow: "#38bdf8", gradient: ["#0ea5e9", "#0284c7"], icon: "🔵" },
  EPIC: { name: "Epic", color: "#a78bfa", glow: "#a78bfa", gradient: ["#8b5cf6", "#7c3aed"], icon: "🟣" },
  LEGENDARY: { name: "Legendary", color: "#fbbf24", glow: "#fbbf24", gradient: ["#f59e0b", "#d97706"], icon: "🟡" }
};

const BADGE_INFO = {
  rookie: { emoji: "🥊", name: "Rookie Fighter", color: "#94a3b8", rarity: RARITY.COMMON },
  fighter: { emoji: "⚔️", name: "Skilled Fighter", color: "#38bdf8", rarity: RARITY.RARE },
  champion: { emoji: "🏆", name: "Battle Champion", color: "#fbbf24", rarity: RARITY.EPIC },
  legend: { emoji: "👑", name: "Legendary Warrior", color: "#a78bfa", rarity: RARITY.LEGENDARY },
  first_win: { emoji: "🎯", name: "First Victory", color: "#22c55e", rarity: RARITY.RARE },
  win_streak_3: { emoji: "🔥", name: "Hot Streak", color: "#fb7185", rarity: RARITY.EPIC },
  survivor: { emoji: "🛡️", name: "Survivor", color: "#7c3aed", rarity: RARITY.EPIC },
  veteran: { emoji: "🎖️", name: "Veteran", color: "#6366f1", rarity: RARITY.RARE }
};

export default function BadgeDisplay({ address, score, onBadgeClaimed }) {
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [minting, setMinting] = useState({});
  const [mintedStatus, setMintedStatus] = useState({});
  const [gasEstimate, setGasEstimate] = useState(null);
  
  // Contract address from env or config
  const contractAddress = import.meta.env.VITE_BADGE_CONTRACT_ADDRESS || "";

  useEffect(() => {
    if (address) {
      loadBadges();
      if (contractAddress) {
        checkMintedStatuses();
      }
    }
  }, [address, contractAddress]);

  const checkMintedStatuses = async () => {
    if (!contractAddress || !address || badges.length === 0) return;
    
    try {
      const statuses = {};
      for (const badge of badges) {
        const badgeId = BADGE_IDS[badge.id];
        if (badgeId) {
          try {
            const minted = await hasMintedBadge(contractAddress, address, badgeId);
            statuses[badge.id] = minted;
          } catch (error) {
            console.error(`Failed to check mint status for ${badge.id}:`, error);
            statuses[badge.id] = false;
          }
        }
      }
      setMintedStatus(statuses);
    } catch (error) {
      console.error("Failed to check minted statuses:", error);
    }
  };

  const loadBadges = async () => {
    setLoading(true);
    try {
      const data = await getPlayerBadges(address);
      setBadges(data.badges || []);
      setStats(data.stats || null);
      
      // Check minted status after loading badges
      if (contractAddress) {
        setTimeout(() => checkMintedStatuses(), 100);
      }
    } catch (error) {
      console.error("Failed to load badges:", error);
      const message = error instanceof ApiError 
        ? error.message 
        : "Failed to load badges. Please try again.";
      alert(message);
      setBadges([]); // Clear badges on error
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBadge = async (badgeId) => {
    setClaiming(true);
    try {
      const result = await claimBadge({ address, badgeId });
      if (result.badge) {
        await loadBadges();
        if (onBadgeClaimed) {
          onBadgeClaimed(result);
        }
      }
    } catch (error) {
      console.error("Failed to claim badge:", error);
      const message = error instanceof ApiError 
        ? error.message 
        : "Failed to claim badge. Please try again.";
      alert(message);
    } finally {
      setClaiming(false);
    }
  };

  const handleMintToWallet = async (badgeId) => {
    if (!contractAddress) {
      alert("Contract address not configured. Please contact support.");
      return;
    }

    const numericBadgeId = BADGE_IDS[badgeId];
    if (!numericBadgeId) {
      alert("Invalid badge ID");
      return;
    }

    setMinting(prev => ({ ...prev, [badgeId]: true }));

    try {
      // Check if on Base network
      const isOnBase = await checkBaseNetwork();
      if (!isOnBase) {
        const switchConfirm = confirm(
          "You need to switch to Base network to mint badges. Switch now?"
        );
        if (switchConfirm) {
          await switchToBaseNetwork();
        } else {
          setMinting(prev => ({ ...prev, [badgeId]: false }));
          return;
        }
      }

      // Mint the badge
      const tx = await mintBadgeToWallet(contractAddress, numericBadgeId);
      
      // Update status
      setMintedStatus(prev => ({ ...prev, [badgeId]: true }));
      
      alert(`Badge minted successfully! Transaction: ${tx.hash}`);
      
      // Refresh status
      await checkMintedStatuses();
      
    } catch (error) {
      console.error("Failed to mint badge:", error);
      if (error.message.includes("user rejected") || error.message.includes("User denied")) {
        alert("Transaction cancelled");
      } else if (error.message.includes("already minted")) {
        alert("You've already minted this badge!");
        setMintedStatus(prev => ({ ...prev, [badgeId]: true }));
      } else {
        alert(`Failed to mint badge: ${error.message}`);
      }
    } finally {
      setMinting(prev => ({ ...prev, [badgeId]: false }));
    }
  };

  const loadGasEstimate = async () => {
    if (!contractAddress) return;
    try {
      const estimate = await estimateMintGas(contractAddress, 1);
      setGasEstimate(parseFloat(estimate).toFixed(4));
    } catch (error) {
      console.error("Failed to estimate gas:", error);
    }
  };

  const getAvailableBadges = () => {
    if (!score || !stats) return [];
    
    const available = [];
    if (score >= 5 && !badges.find(b => b.id === "rookie")) {
      available.push({ id: "rookie", ...BADGE_INFO.rookie });
    }
    if (score >= 25 && !badges.find(b => b.id === "fighter")) {
      available.push({ id: "fighter", ...BADGE_INFO.fighter });
    }
    if (score >= 100 && !badges.find(b => b.id === "champion")) {
      available.push({ id: "champion", ...BADGE_INFO.champion });
    }
    if (score >= 200 && !badges.find(b => b.id === "legend")) {
      available.push({ id: "legend", ...BADGE_INFO.legend });
    }
    if (stats.wins >= 1 && !badges.find(b => b.id === "first_win")) {
      available.push({ id: "first_win", ...BADGE_INFO.first_win });
    }
    if (stats.winStreak >= 3 && !badges.find(b => b.id === "win_streak_3")) {
      available.push({ id: "win_streak_3", ...BADGE_INFO.win_streak_3 });
    }
    if (stats.gamesPlayed >= 10 && !badges.find(b => b.id === "veteran")) {
      available.push({ id: "veteran", ...BADGE_INFO.veteran });
    }
    
    return available;
  };

  const availableBadges = getAvailableBadges();

  if (loading) {
    return <div className="card"><p className="hint">Loading badges...</p></div>;
  }

  return (
    <div className="card">
      <h2>🏅 Your Badges</h2>
      
      {stats && (
        <div className="badge-stats">
          <p>Best Score: <strong>{stats.bestScore}</strong></p>
          <p>Games Played: <strong>{stats.gamesPlayed}</strong></p>
          <p>Wins: <strong>{stats.wins}</strong> | Losses: <strong>{stats.losses}</strong></p>
        </div>
      )}

      {availableBadges.length > 0 && (
        <div className="available-badges">
          <h3>🎁 New Badges Available!</h3>
          <div className="available-badges-grid">
            {availableBadges.map(badge => {
              const info = BADGE_INFO[badge.id] || { emoji: "🏅", name: badge.name, color: "#94a3b8", rarity: RARITY.COMMON };
              const rarity = info.rarity || RARITY.COMMON;
              const rarityClass = rarity.name.toLowerCase();
              
              return (
                <div 
                  key={badge.id} 
                  className={`badge-item available nft-badge rarity-${rarityClass}`}
                  style={{
                    '--rarity-color': rarity.color,
                    '--rarity-glow': rarity.glow,
                    '--gradient-start': rarity.gradient[0],
                    '--gradient-end': rarity.gradient[1]
                  }}
                >
                  <div className="badge-glow"></div>
                  <div className="badge-shine"></div>
                  <div className="badge-content">
                    <div className="badge-rarity-label">
                      <span className="rarity-icon">{rarity.icon}</span>
                      <span className="rarity-name">{rarity.name}</span>
                    </div>
                    <div className="badge-icon-wrapper">
                      <div className="badge-icon" style={{ color: info.color }}>
                        {info.emoji}
                      </div>
                    </div>
                    <div className="badge-name">{info.name}</div>
                    <button
                      className="btn-primary claim-badge-btn"
                      onClick={() => handleClaimBadge(badge.id)}
                      disabled={claiming}
                    >
                      {claiming ? "Claiming..." : "✨ Claim Badge"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {badges.length === 0 ? (
        <p className="hint">No badges earned yet. Play games to earn badges!</p>
      ) : (
        <>
          {contractAddress && gasEstimate === null && (
            <button 
              className="btn-secondary" 
              onClick={loadGasEstimate}
              style={{ marginBottom: "10px", fontSize: "12px" }}
            >
              Show Mint Cost Estimate
            </button>
          )}
          {gasEstimate && (
            <p className="hint" style={{ marginBottom: "15px" }}>
              💰 Estimated mint cost: ~{gasEstimate} ETH per badge
            </p>
          )}
          <div className="badges-grid">
            {badges.map(badge => {
              const info = BADGE_INFO[badge.id] || { 
                emoji: "🏅", 
                name: badge.name || badge.id, 
                color: "#94a3b8", 
                rarity: RARITY.COMMON 
              };
              const isMinted = mintedStatus[badge.id] || false;
              const isMinting = minting[badge.id] || false;
              const rarity = info.rarity || RARITY.COMMON;
              const rarityClass = rarity.name.toLowerCase();
              
              return (
                <div 
                  key={badge.id} 
                  className={`badge-item earned nft-badge rarity-${rarityClass} ${isMinted ? "minted" : ""}`}
                  style={{
                    '--rarity-color': rarity.color,
                    '--rarity-glow': rarity.glow,
                    '--gradient-start': rarity.gradient[0],
                    '--gradient-end': rarity.gradient[1]
                  }}
                >
                  <div className="badge-glow"></div>
                  <div className="badge-shine"></div>
                  <div className="badge-content">
                    <div className="badge-rarity-label">
                      <span className="rarity-icon">{rarity.icon}</span>
                      <span className="rarity-name">{rarity.name}</span>
                    </div>
                    <div className="badge-icon-wrapper">
                      <div className="badge-icon" style={{ color: info.color }}>
                        {info.emoji}
                      </div>
                    </div>
                    <div className="badge-name">{info.name}</div>
                    {badge.description && (
                      <div className="badge-description">{badge.description}</div>
                    )}
                    {badge.earnedAt && (
                      <div className="badge-date">
                        Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                      </div>
                    )}
                    {contractAddress && (
                      <div className="badge-mint-section">
                        {isMinted ? (
                          <div className="mint-status">
                            <span className="minted-badge">✓ In Wallet</span>
                          </div>
                        ) : (
                          <button
                            className="btn-primary mint-button"
                            onClick={() => handleMintToWallet(badge.id)}
                            disabled={isMinting}
                            style={{ fontSize: "11px", padding: "6px 12px" }}
                          >
                            {isMinting ? "Minting..." : "💎 Mint NFT"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

