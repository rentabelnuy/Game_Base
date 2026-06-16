import { useState } from "react";
import { ethers } from "ethers";
import { checkBaseNetwork, switchToBaseNetwork } from "../utils/contract";
import { getPreferredWalletProvider } from "../utils/walletProvider";

/**
 * BaseWalletLogin
 * Класичний EVM login для Base dApp
 */
export default function BaseWalletLogin({ onLogin, title = "Login with Base Wallet" }) {
  const [error, setError] = useState("");

  const connect = async () => {
    try {
      const walletProvider = await getPreferredWalletProvider();
      if (!walletProvider) {
        setError("No wallet detected. Open this app in Base App or connect an EVM wallet.");
        return;
      }

      const onBase = await checkBaseNetwork(walletProvider);
      if (!onBase) {
        await switchToBaseNetwork(walletProvider);
      }

      const provider = new ethers.BrowserProvider(walletProvider);
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
      setError(e?.message || "Connection rejected");
    }
  };

  return (
    <div className="login-card">
      <h3>🔵 {title}</h3>
      <p className="hint" style={{ marginBottom: '15px', fontSize: '13px' }}>
        Connect with Base App or any EVM wallet to play on Base.
      </p>
      <button className="btn-secondary" onClick={connect}>
        🔗 Connect Wallet
      </button>
      {error && <p className="hint error" style={{ marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
