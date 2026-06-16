import { useState } from "react";
import { ethers } from "ethers";
import { BASE_NETWORK, checkBaseNetwork, switchToBaseNetwork } from "../utils/contract";
import { getBaseAccountProvider, getPreferredWalletProvider } from "../utils/walletProvider";

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
        await connectWithBaseAccount();
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

  const connectWithBaseAccount = async () => {
    const baseProvider = getBaseAccountProvider();
    if (!baseProvider) {
      setError("Base Account is unavailable in this browser. Try opening the app in Base App or Coinbase Wallet.");
      return;
    }

    try {
      await baseProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_NETWORK.chainId }],
      });
    } catch (error) {
      // The connect request below can still open the Base Account flow.
      console.warn("Base chain switch before connect failed:", error);
    }

    const nonce = window.crypto?.randomUUID?.().replace(/-/g, "") || `${Date.now()}`;
    const { accounts } = await baseProvider.request({
      method: "wallet_connect",
      params: [
        {
          version: "1",
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId: BASE_NETWORK.chainId,
            },
          },
        },
      ],
    });

    const account = accounts?.[0];
    if (!account?.address) {
      throw new Error("Base Account did not return a wallet address.");
    }

    onLogin({
      address: account.address,
      signature: account.capabilities?.signInWithEthereum?.signature || "",
      message: account.capabilities?.signInWithEthereum?.message || "",
      provider: "base-account",
    });
  };

  return (
    <div className="login-card">
      <h3>🔵 {title}</h3>
      <p className="hint" style={{ marginBottom: '15px', fontSize: '13px' }}>
        Connect with Base Account, Base App, or any EVM wallet to play on Base.
      </p>
      <button className="btn-secondary" onClick={connect}>
        🔗 Connect Wallet
      </button>
      {error && <p className="hint error" style={{ marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
