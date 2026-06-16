# Battle Arena Badges Contract

This folder contains the Base badge minting contract for Battle Arena.

## Contract

Main contract:

```txt
contracts/BattleArenaBadges.sol
```

It is an ERC-1155 contract with:

- signature-gated badge minting
- one mint per wallet per badge id
- backend EIP-712 authorization
- batch minting
- pause/unpause
- owner-controlled signer rotation
- Base and Base Sepolia deployment config

The EIP-712 domain is:

```txt
name: BattleArenaBadges
version: 1
chainId: 8453
verifyingContract: deployed_contract_address
```

This must match `backend/badgeSigner.js`.

## Install

```bash
npm install
```

## Environment

Copy:

```bash
copy .env.example .env
```

Fill:

```env
PRIVATE_KEY=deployment_wallet_private_key_without_0x
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=optional_basescan_api_key
BADGE_AUTHORIZED_SIGNER=0x_backend_signer_wallet_address
BADGE_BASE_URI=https://your-frontend-domain/badges/
```

`BADGE_AUTHORIZED_SIGNER` must be the public address derived from the backend `BADGE_SIGNER_PK`.

## Compile

```bash
npm run compile
```

## Deploy to Base Sepolia

```bash
npm run deploy:baseSepolia
```

## Deploy to Base Mainnet

```bash
npm run deploy:base
```

After deploy, copy the printed contract address.

## Backend Variables

Set these in Railway:

```env
BADGE_SIGNER_PK=backend_signer_private_key_without_0x
BADGE_CONTRACT_ADDRESS=deployed_contract_address
BADGE_CHAIN_ID=8453
```

For Base Sepolia testing:

```env
BADGE_CHAIN_ID=84532
```

## Frontend Variables

Set this in Vercel:

```env
VITE_BADGE_CONTRACT_ADDRESS=deployed_contract_address
```

Then redeploy frontend and backend.
