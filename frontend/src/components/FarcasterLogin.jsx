import { useState } from "react";
import { ethers } from "ethers";

/**
 * FarcasterLogin
 * Використовує wallet як identity proof для Farcaster Mini App
 * (реальний Farcaster Signer можна додати пізніше)
 */
export default function FarcasterLogin({ onLogin }) {
  const [status, setStatus] = useState("");

  const login = async () => {
    try {
      if (!window.ethereum) {
        setStatus("Wallet not found");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const payload = {
        address,
        type: "farcaster-login",
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
        provider: "farcaster"
      });

    } catch (err) {
      setStatus("Login cancelled");
    }
  };

  return (
    <div className="login-card">
      <h3>🎭 Login with Farcaster</h3>
      <p className="hint" style={{ marginBottom: '15px', fontSize: '13px' }}>
        Connect your wallet to play on-chain games directly from Farcaster
      </p>
      <button className="btn-primary" onClick={login}>
        🎭 Connect Wallet
      </button>
      {status && <p className="hint" style={{ marginTop: '10px' }}>{status}</p>}
    </div>
  );
}
