import { useState } from "react";
import { ethers } from "ethers";
import { checkBaseNetwork, switchToBaseNetwork } from "../utils/contract";

/**
 * BaseWalletLogin
 * Класичний EVM login для Base dApp
 */
export default function BaseWalletLogin({ onLogin, title = "Login with Base Wallet" }) {
  const [error, setError] = useState("");

  const connect = async () => {
    try {
      if (!window.ethereum) {
        setError("No wallet detected");
        return;
      }

      const onBase = await checkBaseNetwork();
      if (!onBase) {
        await switchToBaseNetwork();
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const payload = {
        address,
        type: "base-wallet-login",
        timestamp: Date.now()
      };

      const message = `
Battle Arena Login
address: ${payload.address}
timestamp: ${payload.timestamp}
      `.trim();

      const signature = await signer.signMessage(message);

      onLogin({
        address,
        signature,
        provider: "base"
      });

    } catch (e) {
      setError("Connection rejected");
    }
  };

  return (
    <div className="login-card">
      <h3>🔵 {title}</h3>
      <p className="hint" style={{ marginBottom: '15px', fontSize: '13px' }}>
        Connect your wallet to play on Base. Fast & cheap transactions guaranteed.
      </p>
      <button className="btn-secondary" onClick={connect}>
        🔗 Connect Wallet
      </button>
      {error && <p className="hint error" style={{ marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
