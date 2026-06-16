import { createBaseAccountSDK } from "@base-org/account";

const BASE_RDNS = "com.coinbase.wallet";
let baseAccountProvider = null;

export async function getPreferredWalletProvider({ includeBaseAccountFallback = false } = {}) {
  if (typeof window === "undefined") {
    return null;
  }

  const discoveredProviders = await discoverInjectedProviders();
  const baseProvider = discoveredProviders.find(({ info, provider }) => {
    const rdns = info?.rdns?.toLowerCase?.() || "";
    return rdns === BASE_RDNS || provider?.isCoinbaseWallet;
  });

  if (baseProvider?.provider) {
    return baseProvider.provider;
  }

  if (window.ethereum?.providers?.length) {
    return (
      window.ethereum.providers.find((provider) => provider?.isCoinbaseWallet) ||
      window.ethereum.providers[0]
    );
  }

  if (window.ethereum) {
    return window.ethereum;
  }

  return includeBaseAccountFallback ? getBaseAccountProvider() : null;
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
