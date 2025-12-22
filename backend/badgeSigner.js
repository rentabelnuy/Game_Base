import 'dotenv/config';
import { Wallet } from "ethers";

console.log('BADGE_SIGNER_PK:', process.env.BADGE_SIGNER_PK);
console.log('Length:', process.env.BADGE_SIGNER_PK?.length);

if (!process.env.BADGE_SIGNER_PK) {
  throw new Error('BADGE_SIGNER_PK not found in .env');
}
const wallet = new Wallet(process.env.BADGE_SIGNER_PK);

export const signBadge = (addr, id) =>
  wallet.signMessage(`BattleArenaBadge:${addr}:${id}`);