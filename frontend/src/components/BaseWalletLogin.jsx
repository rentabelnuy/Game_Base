import { useState } from "react";
import { ethers } from "ethers";
import { BASE_NETWORK, checkBaseNetwork, switchToBaseNetwork } from "../utils/contract";
import { getBaseAccountProvider, getPreferredWalletProvider, getWalletConnectProvider } from "../utils/walletProvider";

export default function BaseWalletLogin({ onLogin, title = "Login with Base Wallet" }) {
  const [error, setError] = useState("");

  const connectInjectedWallet = async () => {
    try {
      setError("");
      const walletProvider = await getPreferredWalletProvider();
      if (!walletProvider) {
        setError("No browser wallet found. Open this site inside MetaMask, Rabby, Coinbase Wallet, or use Base Account below.");
        return;
      }

      await loginWithEvmProvider(walletProvider, "evm");
    } catch (e) {
      setError(e?.message || "Connection rejected");
    }
  };

  const connectWalletConnect = async () => {
    try {
      setError("");
      const walletProvider = await getWalletConnectProvider();
      await walletProvider.connect();
      await loginWithEvmProvider(walletProvider, "walletconnect");
    } catch (e) {
      setError(e?.message || "WalletConnect connection rejected");
    }
  };

  const connectWithBaseAccount = async () => {
    try {
      setError("");
      const baseProvider = getBaseAccountProvider();
      if (!baseProvider) {
        setError("Base Account is unavailable in this browser.");
        return;
      }

      try {
        await baseProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_NETWORK.chainId }],
        });
      } catch (switchError) {
        console.warn("Base chain switch before connect failed:", switchError);
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
    } catch (e) {
      setError(e?.message || "Base Account connection rejected");
    }
  };

  const loginWithEvmProvider = async (walletProvider, providerName) => {
    const onBase = await checkBaseNetwork(walletProvider);
    if (!onBase) {
      await switchToBaseNetwork(walletProvider);
    }

    const provider = new ethers.BrowserProvider(walletProvider);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const payload = {
      address,
      type: `${providerName}-login`,
      timestamp: Date.now(),
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
      provider: providerName,
    });
  };

  return (
    <div className="login-card">
      <h3>{title}</h3>
      <p className="hint login-hint">
        Connect with MetaMask, Rabby, Coinbase Wallet, Base App, or Base Account.
      </p>
      <button className="btn-primary" onClick={connectInjectedWallet}>
        Connect EVM Wallet
      </button>
      <button className="btn-secondary wallet-alt-button" onClick={connectWalletConnect}>
        Connect with WalletConnect
      </button>
      <button className="btn-secondary wallet-alt-button" onClick={connectWithBaseAccount}>
        Sign in with Base Account
      </button>
      {error && <p className="hint error login-error">{error}</p>}
    </div>
  );
}
