import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { BASE_NETWORK, checkBaseNetwork, switchToBaseNetwork } from "../utils/contract";
import { getBaseAccountProvider, getInjectedWalletProviders, getPreferredWalletProvider, getWalletConnectProvider } from "../utils/walletProvider";

function getFriendlyWalletError(error, fallback = "Wallet connection was cancelled.") {
  const message = error?.message || "";
  const code = error?.code || error?.info?.error?.code || error?.data?.code;

  if (
    code === 4001 ||
    code === "ACTION_REJECTED" ||
    message.includes("user rejected") ||
    message.includes("User rejected") ||
    message.includes("User denied") ||
    message.includes("ethers-user-denied") ||
    message.includes("rejectAllApprovals")
  ) {
    return "Signature request was rejected.";
  }

  if (message.includes("wallet_switchEthereumChain")) {
    return "Base network switch was rejected.";
  }

  if (message.includes("No browser wallet")) {
    return message;
  }

  return fallback;
}

export default function BaseWalletLogin({ onLogin, title = "Connect Wallet" }) {
  const [error, setError] = useState("");
  const [hasInjectedWallet, setHasInjectedWallet] = useState(false);

  useEffect(() => {
    let mounted = true;
    getInjectedWalletProviders().then((providers) => {
      if (mounted) {
        setHasInjectedWallet(providers.length > 0);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

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
      setError(getFriendlyWalletError(e, "Browser wallet connection was cancelled."));
    }
  };

  const connectWalletConnect = async () => {
    try {
      setError("");
      const walletProvider = await getWalletConnectProvider();
      await walletProvider.connect();
      await loginWithEvmProvider(walletProvider, "walletconnect");
    } catch (e) {
      setError(getFriendlyWalletError(e, "WalletConnect connection was cancelled."));
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
      setError(getFriendlyWalletError(e, "Base Account connection was cancelled."));
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
        Use WalletConnect in mobile browsers, or connect directly inside MetaMask, Rabby, Coinbase Wallet, or Base App.
      </p>
      <button className={hasInjectedWallet ? "btn-secondary" : "btn-primary"} onClick={connectWalletConnect}>
        Connect with WalletConnect
      </button>
      {hasInjectedWallet && (
        <button className="btn-primary wallet-alt-button" onClick={connectInjectedWallet}>
          Connect Browser Wallet
        </button>
      )}
      <button className="btn-secondary wallet-alt-button" onClick={connectWithBaseAccount}>
        Sign in with Base Account
      </button>
      {error && <p className="hint error login-error">{error}</p>}
    </div>
  );
}
