import { ethers } from "ethers";

// Contract ABI (minimal - only functions we need)
export const BADGE_CONTRACT_ABI = [
  "function mintBadge(uint256 badgeId, bytes32 requestId, uint256 deadline, bytes calldata signature) external",
  "function mintBadges(uint256[] calldata badgeIds, bytes32[] calldata requestIds, uint256[] calldata deadlines, bytes[] calldata signatures) external",
  "function hasUserMinted(address user, uint256 badgeId) external view returns (bool)",
  "function getUserBadges(address user) external view returns (uint256[])",
  "function getBadgeInfo(uint256 badgeId) external view returns ((string name, string description, bool exists, uint256 maxSupply, uint256 currentSupply))",
  "event BadgeMinted(address indexed to, uint256 indexed badgeId, uint256 amount)"
];

// Badge ID mapping (matches contract)
export const BADGE_IDS = {
  rookie: 1,
  fighter: 2,
  champion: 3,
  legend: 4,
  first_win: 5,
  win_streak_3: 6,
  survivor: 7,
  veteran: 8
};

// Base network config
export const BASE_NETWORK = {
  chainId: "0x2105", // 8453 in hex
  chainName: "Base",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};

export const BASE_SEPOLIA_NETWORK = {
  chainId: "0x14a34", // 84532 in hex
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

/**
 * Get contract instance
 */
export async function getBadgeContract(contractAddress) {
  if (!window.ethereum) {
    throw new Error("No wallet detected");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, BADGE_CONTRACT_ABI, signer);
}

/**
 * Check if user is on Base network
 */
export async function checkBaseNetwork() {
  if (!window.ethereum) return false;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return network.chainId === BigInt(8453) || network.chainId === BigInt(84532);
  } catch (error) {
    return false;
  }
}

/**
 * Switch to Base network
 */
export async function switchToBaseNetwork() {
  if (!window.ethereum) {
    throw new Error("No wallet detected");
  }

  try {
    // Try to switch to Base mainnet
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_NETWORK.chainId }],
    });
  } catch (switchError) {
    // If chain doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [BASE_NETWORK],
        });
      } catch (addError) {
        throw new Error("Failed to add Base network");
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Mint a badge to wallet
 */
export async function mintBadgeToWallet(contractAddress, authorization) {
  const contract = await getBadgeContract(contractAddress);
  const tx = await contract.mintBadge(
    authorization.badgeId,
    authorization.requestId,
    authorization.deadline,
    authorization.signature
  );
  return await tx.wait();
}

/**
 * Batch mint multiple badges
 */
export async function mintBadgesToWallet(contractAddress, payload) {
  const contract = await getBadgeContract(contractAddress);
  const tx = await contract.mintBadges(
    payload.badgeIds,
    payload.requestIds,
    payload.deadlines,
    payload.signatures
  );
  return await tx.wait();
}

/**
 * Check if user has minted a badge
 */
export async function hasMintedBadge(contractAddress, userAddress, badgeId) {
  const contract = await getBadgeContract(contractAddress);
  return await contract.hasUserMinted(userAddress, badgeId);
}

/**
 * Get user's minted badges from contract
 */
export async function getUserMintedBadges(contractAddress, userAddress) {
  const contract = await getBadgeContract(contractAddress);
  return await contract.getUserBadges(userAddress);
}

/**
 * Estimate gas cost for minting
 */
export async function estimateMintGas() {
  // Exact estimate needs a live backend authorization payload.
  // We return a conservative UX fallback value.
  return "0.01";
}




