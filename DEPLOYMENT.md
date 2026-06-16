# Battle Arena Base Deployment Guide

## Backend

Recommended host: Railway.

Environment variables:

```env
PORT=3001
BADGE_SIGNER_PK=your_private_key_for_signing
NODE_ENV=production
```

Deploy from the repository root with `railway.json`, or deploy from the `backend` folder with `backend/railway.json`.

Verify:

```txt
https://your-backend-domain/health
```

Expected:

```json
{"status":"ok"}
```

## Frontend

Recommended host: Vercel.

Settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables:

```env
VITE_API_BASE=https://your-backend-domain
VITE_BADGE_CONTRACT_ADDRESS=0x... # optional
```

Verify:

```txt
https://your-frontend-domain/manifest.webmanifest
```

## Base App

Submit/register the deployed frontend as a standard web app.

Use:

- App name: `Battle Arena`
- Category: `Games`
- Primary URL: `https://your-frontend-domain`
- Manifest URL: `https://your-frontend-domain/manifest.webmanifest`
- Icon: `https://your-frontend-domain/assets/base/icon.png`
- Preview image: `https://your-frontend-domain/assets/base/og.png`

## Optional Badge Contract

```bash
cd contracts
npm install
```

Create `contracts/.env`:

```env
PRIVATE_KEY=your_deployment_wallet_private_key
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_api_key_optional
BADGE_BASE_URI=https://your-domain.com/api/badges/
```

Deploy:

```bash
npm run deploy:base
```

Copy the deployed contract address to the frontend production environment:

```env
VITE_BADGE_CONTRACT_ADDRESS=0x...
```

## Publish Checklist

- Backend `/health` returns `{"status":"ok"}`
- Frontend loads over HTTPS
- `manifest.webmanifest` loads over HTTPS
- `assets/base/icon.png` and `assets/base/og.png` load over HTTPS
- Wallet connects in Base App or Coinbase Wallet
- Wallet switches to Base
- Game round can be completed
- Leaderboard loads
- Badge claim works if contract is enabled
