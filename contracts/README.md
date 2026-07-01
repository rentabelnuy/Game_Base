# Battle Arena Badge Contract

This Hardhat workspace deploys the ERC-1155 badge contract used by Battle Arena.

## Contract

Main contract:

```txt
contracts/contracts/BattleArenaBadges.sol
```

Features:

- ERC-1155 badges
- one mint per wallet per badge id
- EIP-712 backend authorization
- replay protection through request ids
- batch minting
- pause/unpause
- owner-controlled signer rotation
- Base and Base Sepolia network config

EIP-712 domain:

```txt
name: BattleArenaBadges
version: 1
chainId: 8453
verifyingContract: deployed_contract_address
```

The domain must match `backend/badgeSigner.js`.

## Install

```bash
npm install
```

## Environment

Copy the example file:

```cmd
copy .env.example .env
```

Fill `.env`:

```env
PRIVATE_KEY=deployment_wallet_private_key_without_0x
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=
BADGE_AUTHORIZED_SIGNER=0x_backend_signer_wallet_address
BADGE_BASE_URI=https://your-frontend-domain/badges/
```

`BADGE_AUTHORIZED_SIGNER` is the public address derived from the backend `BADGE_SIGNER_PK`.

## Compile

```bash
npm run compile
```

## Deploy to Base Sepolia

```bash
npm run deploy:baseSepolia
```

Use Sepolia for testing. Railway should use:

```env
BADGE_CHAIN_ID=84532
```

## Deploy to Base Mainnet

```bash
npm run deploy:base
```

Use mainnet for production. Railway should use:

```env
BADGE_CHAIN_ID=8453
```

## After Deployment

Copy the printed contract address into Railway:

```env
BADGE_CONTRACT_ADDRESS=deployed_contract_address
BADGE_CHAIN_ID=8453
BADGE_SIGNER_PK=backend_signer_private_key_without_0x
```

Copy the same contract address into Vercel:

```env
VITE_BADGE_CONTRACT_ADDRESS=deployed_contract_address
```

Then redeploy both backend and frontend.

## Verify on Basescan

Verification is optional for app functionality. To verify automatically, create a Basescan API key and set:

```env
BASESCAN_API_KEY=your_basescan_api_key
```

Then rerun the deploy script or verify manually through Hardhat/Basescan.

## Signer Rotation

If the backend signer private key is exposed, rotate it immediately:

```js
const c = await ethers.getContractAt("BattleArenaBadges", "deployed_contract_address")
await c.setAuthorizedSigner("0xNewSignerAddress")
```

Update Railway with the new signer private key and redeploy the backend.
