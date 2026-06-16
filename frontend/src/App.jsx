import { useState, useEffect } from "react";
import GameBoard from "./components/GameBoard";
import Leaderboard from "./components/Leaderboard";
import BadgeDisplay from "./components/BadgeDisplay";
import BaseWalletLogin from "./components/BaseWalletLogin";
import FarcasterLogin from "./components/FarcasterLogin";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("game"); // "game", "leaderboard", "badges"
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Key to force GameBoard reset
  
  // 🔧 DEV MODE - Set to false to enable wallet login
  const DEV_MODE = false;
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const userAgent = window.navigator.userAgent.toLowerCase();

    // Check if running in Farcaster
    if (searchParams.has("farcaster") || window.parent !== window) {
      setIsFarcaster(true);
    }

    // Base App opens standard web apps in an in-app browser.
    if (searchParams.has("base-app") || searchParams.get("source") === "base-app" || userAgent.includes("base")) {
      setIsBaseApp(true);
    }
    
    // Auto-login in dev mode
    if (DEV_MODE) {
      setUser({ address: "0xDEV_PLAYER" });
      // Auto-start game view
      setView("game");
    }
  }, []);

  // Reset game when switching to game view (fixes navigation bug)
  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === "game") {
      // Force GameBoard to reset by changing key
      setGameKey(prev => prev + 1);
    }
  };
  
  const handleLogin = (loginData) => {
    setUser(loginData);
  };


  const handleOpenBaseApp = () => {
    window.open("https://base.app", "_blank", "noopener,noreferrer");
  };

  const handleOpenFarcaster = () => {
    window.open("https://warpcast.com/~/apps", "_blank", "noopener,noreferrer");
  };

  // Show login if not authenticated
  if (!user) {
    return (
      <div className="app">
        <h1>⚔️ Battle Arena</h1>
        <div className="login-wrapper">
          {isFarcaster ? (
            <FarcasterLogin onLogin={handleLogin} />
          ) : (
            <>
              <FarcasterLogin onLogin={handleLogin} />
              <BaseWalletLogin
                onLogin={handleLogin}
                title={isBaseApp ? "Continue in Base App" : "Login with External Wallet"}
              />
              <div className="login-card quick-links">
                <h3>🚀 Open Platforms</h3>
                <button className="btn-secondary" onClick={handleOpenBaseApp}>Open Base App</button>
                <button className="btn-secondary" onClick={handleOpenFarcaster} style={{ marginTop: "10px" }}>Open Farcaster Apps</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>⚔️ Battle Arena</h1>
        {isFarcaster && (
          <div className="farcaster-badge">
            <span>🎭</span> Farcaster Mini App
          </div>
        )}
        {!isFarcaster && (
          <div className="base-badge">
            <span>🔵</span> {isBaseApp ? "Base App Ready" : "Built on Base"}
          </div>
        )}
      </div>
      
      <div className={`user-info ${isFarcaster ? 'farcaster-user' : 'base-user'}`}>
        <p className="hint">
          {isFarcaster ? "🎭 Farcaster" : "🔵 Base"} • {user.address.slice(0, 6)}...{user.address.slice(-4)}
        </p>
        {isFarcaster && (
          <p className="hint" style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
            Play on-chain games directly from Farcaster
          </p>
        )}
        {!isFarcaster && (
          <p className="hint" style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
            {isBaseApp ? "Running in Base App • Connect and play" : "Powered by Base • Fast & cheap transactions"}
          </p>
        )}
      </div>
      
      <div className="nav-buttons">
        <button
          className={view === "game" ? "btn-primary" : "btn-secondary"}
          onClick={() => handleViewChange("game")}
        >
          🎮 Play Game
        </button>
        <button
          className={view === "leaderboard" ? "btn-primary" : "btn-secondary"}
          onClick={() => handleViewChange("leaderboard")}
        >
          🏆 Leaderboard
        </button>
        <button
          className={view === "badges" ? "btn-primary" : "btn-secondary"}
          onClick={() => handleViewChange("badges")}
        >
          🏅 My Badges
        </button>
      </div>

      {view === "game" && <GameBoard key={gameKey} address={user.address} />}
      {view === "leaderboard" && <Leaderboard currentAddress={user.address} />}
      {view === "badges" && <BadgeDisplay address={user.address} />}
    </div>
  );
}
