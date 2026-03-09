import 'dotenv/config';
import { Wallet, getAddress } from "ethers";
import { randomUUID } from "crypto";

if (!process.env.BADGE_SIGNER_PK) {
  throw new Error('BADGE_SIGNER_PK not found in .env');
}
if (!process.env.BADGE_CONTRACT_ADDRESS) {
  throw new Error('BADGE_CONTRACT_ADDRESS not found in .env');
}

const wallet = new Wallet(process.env.BADGE_SIGNER_PK);

const domain = {
  name: "BattleArenaBadges",
  version: "1",
  chainId: Number(process.env.BADGE_CHAIN_ID || 8453),
  verifyingContract: getAddress(process.env.BADGE_CONTRACT_ADDRESS),
};

const types = {
  MintAuthorization: [
    { name: "account", type: "address" },
    { name: "badgeId", type: "uint256" },
    { name: "requestId", type: "bytes32" },
    { name: "deadline", type: "uint256" },
  ],
};

const BADGE_ID_MAP = {
  rookie: 1,
  fighter: 2,
  champion: 3,
  legend: 4,
  first_win: 5,
  win_streak_3: 6,
  survivor: 7,
  veteran: 8,
};

function toBytes32FromUuid(uuid) {
  return `0x${uuid.replace(/-/g, "").padEnd(64, "0")}`;
}

export async function signBadge(address, badgeKey) {
  const badgeId = BADGE_ID_MAP[badgeKey];
  if (!badgeId) {
    throw new Error(`Unknown badge id: ${badgeKey}`);
  }

  const requestId = toBytes32FromUuid(randomUUID());
  const deadline = Math.floor(Date.now() / 1000) + 10 * 60;

  const value = {
    account: getAddress(address),
    badgeId,
    requestId,
    deadline,
  };

  const signature = await wallet.signTypedData(domain, types, value);

  return {
    badgeId,
    requestId,
    deadline,
    signature,
    signer: wallet.address,
  };
}
