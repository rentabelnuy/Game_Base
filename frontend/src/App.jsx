import { useState, useEffect } from "react";
import GameBoard from "./components/GameBoard";
import Leaderboard from "./components/Leaderboard";
import BadgeDisplay from "./components/BadgeDisplay";
import BaseWalletLogin from "./components/BaseWalletLogin";
import { disconnectWalletProvider } from "./utils/walletProvider";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("game");
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [baseOpenMessage, setBaseOpenMessage] = useState("");

  const DEV_MODE = false;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const userAgent = window.navigator.userAgent.toLowerCase();

    if (searchParams.has("base-app") || searchParams.get("source") === "base-app" || userAgent.includes("base")) {
      setIsBaseApp(true);
    }

    if (DEV_MODE) {
      setUser({ address: "0xDEV_PLAYER" });
      setView("game");
    }
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === "game") {
      setGameKey((prev) => prev + 1);
    }
  };

  const handleLogin = (loginData) => {
    setUser(loginData);
  };

  const handleLogout = async () => {
    try {
      await disconnectWalletProvider(user?.provider);
    } catch (error) {
      console.warn("Wallet disconnect failed:", error);
    } finally {
      setUser(null);
      setView("game");
      setGameKey((prev) => prev + 1);
    }
  };

  const handleOpenBaseApp = async () => {
    const appUrl = window.location.origin;
    try {
      await navigator.clipboard?.writeText(appUrl);
      setBaseOpenMessage("App link copied. Open Base App and paste it in Browse/Search if it opens Home.");
    } catch {
      setBaseOpenMessage("Open Base App, then paste this app URL in Browse/Search.");
    }

    window.open("https://base.app", "_blank", "noopener,noreferrer");
  };

  if (!user) {
    return (
      <div className="app">
        <h1>Battle Arena</h1>
        <div className="login-wrapper">
          <BaseWalletLogin
            onLogin={handleLogin}
            title={isBaseApp ? "Continue in Base App" : "Connect Wallet"}
          />
          {!isBaseApp && (
            <div className="login-card quick-links">
              <h3>Open Base</h3>
              <button className="btn-secondary" onClick={handleOpenBaseApp}>
                Open Base App
              </button>
              {baseOpenMessage && <p className="hint base-open-hint">{baseOpenMessage}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Battle Arena</h1>
        <div className="base-badge">
          <span>Base</span> {isBaseApp ? "Running in Base App" : "Built on Base"}
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Disconnect
        </button>
      </div>

      <div className="user-info base-user">
        <p className="hint">
          Base wallet: {user.address.slice(0, 6)}...{user.address.slice(-4)}
        </p>
        <p className="hint" style={{ fontSize: "11px", marginTop: "4px", opacity: 0.8 }}>
          {isBaseApp ? "Connected through Base App" : "Powered by Base"}
        </p>
      </div>

      <div className="nav-buttons">
        <button
          className={view === "game" ? "btn-primary" : "btn-secondary"}
          onClick={() => handleViewChange("game")}
        >
          Play Game
        </button>
        <button
          className={view === "leaderboard" ? "btn-primary" : "btn-secondary"}
          onClick={() => handleViewChange("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className={view === "badges" ? "btn-primary" : "btn-secondary"}
          onClick={() => handleViewChange("badges")}
        >
          My Badges
        </button>
      </div>

      {view === "game" && <GameBoard key={gameKey} address={user.address} />}
      {view === "leaderboard" && <Leaderboard currentAddress={user.address} />}
      {view === "badges" && <BadgeDisplay address={user.address} />}
    </div>
  );
}
