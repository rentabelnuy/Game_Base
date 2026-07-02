import { ethers } from "ethers";
import { Attribution } from "ox/erc8021";
import { getPreferredWalletProvider } from "./walletProvider";

// Contract ABI (minimal - only functions we need)
export const BADGE_CONTRACT_ABI = [
  "function mintBadge(uint256 badgeId, bytes32 requestId, uint256 deadline, bytes calldata signature) external",
  "function mintBadges(uint256[] calldata badgeIds, bytes32[] calldata requestIds, uint256[] calldata deadlines, bytes[] calldata signatures) external",
  "function hasUserMinted(address user, uint256 badgeId) external view returns (bool)",
  "function getUserBadges(address user) external view returns (uint256[])",
  "function getBadgeInfo(uint256 badgeId) external view returns ((string name, string description, bool exists, uint256 maxSupply, uint256 currentSupply))",
  "error InvalidSigner()",
  "error AuthorizationExpired()",
  "error AuthorizationAlreadyUsed()",
  "error InvalidAuthorization()",
  "error BadgeAlreadyExists()",
  "error BadgeDoesNotExist()",
  "error BadgeAlreadyMinted()",
  "error MaxSupplyReached()",
  "error LengthMismatch()",
  "error EmptyBatch()",
  "error BatchTooLarge()",
  "event BadgeMinted(address indexed to, uint256 indexed badgeId, uint256 amount)"
];

const BADGE_CONTRACT_INTERFACE = new ethers.Interface(BADGE_CONTRACT_ABI);

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

const BUILDER_CODES = ["bc_efviyscl"];
const BUILDER_CODE_DATA_SUFFIX = Attribution.toDataSuffix({ codes: BUILDER_CODES });

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

function appendBuilderCodeSuffix(data) {
  if (!data || data === "0x") {
    return BUILDER_CODE_DATA_SUFFIX;
  }

  return `${data}${BUILDER_CODE_DATA_SUFFIX.slice(2)}`;
}

async function sendBuilderAttributedTransaction(contract, transactionRequest) {
  if (!contract.runner?.sendTransaction) {
    throw new Error("Connected wallet cannot send transactions");
  }

  try {
    const tx = await contract.runner.sendTransaction({
      ...transactionRequest,
      data: appendBuilderCodeSuffix(transactionRequest.data),
    });

    return await tx.wait();
  } catch (error) {
    if (error?.code === "ACTION_REJECTED") {
      throw error;
    }

    console.warn("Builder Code attribution failed; retrying transaction without suffix.", error);

    const tx = await contract.runner.sendTransaction(transactionRequest);
    return await tx.wait();
  }
}

function findErrorData(error) {
  if (!error || typeof error !== "object") return null;

  if (typeof error.data === "string" && error.data.startsWith("0x")) {
    return error.data;
  }

  for (const key of ["revert", "error", "info"]) {
    const data = findErrorData(error[key]);
    if (data) return data;
  }

  return null;
}

export function getBadgeMintError(error) {
  const data = findErrorData(error);
  if (!data) return null;

  try {
    const parsed = BADGE_CONTRACT_INTERFACE.parseError(data);
    return parsed ? { name: parsed.name, args: parsed.args } : null;
  } catch {
    return null;
  }
}

export function getBadgeMintErrorMessage(error) {
  const parsed = getBadgeMintError(error);

  switch (parsed?.name) {
    case "BadgeAlreadyMinted":
      return "This badge is already minted in your wallet.";
    case "AuthorizationExpired":
      return "The mint authorization expired. Please try again.";
    case "AuthorizationAlreadyUsed":
      return "This mint authorization was already used. Please try again.";
    case "InvalidAuthorization":
      return "The mint authorization is invalid. Please refresh the page and try again.";
    case "BadgeDoesNotExist":
      return "This badge is not registered in the contract.";
    case "MaxSupplyReached":
      return "This badge has reached its mint limit.";
    case "LengthMismatch":
    case "EmptyBatch":
    case "BatchTooLarge":
      return "The badge mint request is invalid. Please try again.";
    default:
      return null;
  }
}

/**
 * Get contract instance
 */
export async function getBadgeContract(contractAddress, walletProvider = null) {
  const injectedProvider = walletProvider || await getPreferredWalletProvider();
  if (!injectedProvider) {
    throw new Error("No wallet detected");
  }

  const provider = new ethers.BrowserProvider(injectedProvider);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, BADGE_CONTRACT_ABI, signer);
}

/**
 * Check if user is on Base network
 */
export async function checkBaseNetwork(walletProvider = null) {
  const injectedProvider = walletProvider || await getPreferredWalletProvider();
  if (!injectedProvider) return false;

  try {
    const provider = new ethers.BrowserProvider(injectedProvider);
    const network = await provider.getNetwork();
    return network.chainId === BigInt(8453) || network.chainId === BigInt(84532);
  } catch (error) {
    return false;
  }
}

/**
 * Switch to Base network
 */
export async function switchToBaseNetwork(walletProvider = null) {
  const injectedProvider = walletProvider || await getPreferredWalletProvider();
  if (!injectedProvider) {
    throw new Error("No wallet detected");
  }

  try {
    // Try to switch to Base mainnet
    await injectedProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_NETWORK.chainId }],
    });
  } catch (switchError) {
    // If chain doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await injectedProvider.request({
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
  const transactionRequest = await contract.mintBadge.populateTransaction(
    authorization.badgeId,
    authorization.requestId,
    authorization.deadline,
    authorization.signature
  );

  return await sendBuilderAttributedTransaction(contract, transactionRequest);
}

/**
 * Batch mint multiple badges
 */
export async function mintBadgesToWallet(contractAddress, payload) {
  const contract = await getBadgeContract(contractAddress);
  const transactionRequest = await contract.mintBadges.populateTransaction(
    payload.badgeIds,
    payload.requestIds,
    payload.deadlines,
    payload.signatures
  );

  return await sendBuilderAttributedTransaction(contract, transactionRequest);
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




