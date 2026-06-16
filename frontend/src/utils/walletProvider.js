import { createBaseAccountSDK } from "@base-org/account";

let baseAccountProvider = null;

export async function getPreferredWalletProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const providers = await getInjectedWalletProviders();
  return providers[0]?.provider || null;
}

export async function getInjectedWalletProviders() {
  if (typeof window === "undefined") {
    return [];
  }

  const discoveredProviders = await discoverInjectedProviders();
  const providers = [];
  const seen = new Set();

  const addProvider = (provider, info = {}) => {
    if (!provider || seen.has(provider)) return;
    seen.add(provider);
    providers.push({ provider, info });
  };

  discoveredProviders.forEach(({ info, provider }) => addProvider(provider, info));

  if (window.ethereum?.providers?.length) {
    window.ethereum.providers.forEach((provider) => addProvider(provider, getProviderInfo(provider)));
  } else if (window.ethereum) {
    addProvider(window.ethereum, getProviderInfo(window.ethereum));
  }

  return sortInjectedProviders(providers);
}

export function getBaseAccountProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!baseAccountProvider) {
    baseAccountProvider = createBaseAccountSDK({
      appName: "Battle Arena",
      appLogoUrl: `${window.location.origin}/assets/base/icon.png`,
    }).getProvider();
  }

  return baseAccountProvider;
}

function discoverInjectedProviders() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve([]);
      return;
    }

    const providers = [];
    const onProvider = (event) => {
      if (event.detail?.provider) {
        providers.push(event.detail);
      }
    };

    window.addEventListener("eip6963:announceProvider", onProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onProvider);
      resolve(providers);
    }, 250);
  });
}

function getProviderInfo(provider) {
  if (provider?.isRabby) {
    return { name: "Rabby", rdns: "io.rabby" };
  }

  if (provider?.isMetaMask && !provider?.isCoinbaseWallet) {
    return { name: "MetaMask", rdns: "io.metamask" };
  }

  if (provider?.isCoinbaseWallet) {
    return { name: "Coinbase Wallet", rdns: "com.coinbase.wallet" };
  }

  return { name: "Browser Wallet" };
}

function sortInjectedProviders(providers) {
  const priority = (item) => {
    const rdns = item.info?.rdns?.toLowerCase?.() || "";
    const name = item.info?.name?.toLowerCase?.() || "";
    if (rdns.includes("rabby") || name.includes("rabby") || item.provider?.isRabby) return 0;
    if (rdns.includes("metamask") || name.includes("metamask") || item.provider?.isMetaMask) return 1;
    if (rdns.includes("coinbase") || name.includes("coinbase") || item.provider?.isCoinbaseWallet) return 2;
    return 3;
  };

  return [...providers].sort((a, b) => priority(a) - priority(b));
}
