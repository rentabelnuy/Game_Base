# Battle Arena

Battle Arena is a competitive Rock Paper Scissors and tile-selection game built for Base. Players connect a Base-compatible EVM wallet, play rounds against bots or other players, climb the leaderboard, and can optionally claim badge rewards through a Base smart contract.

## Features

- Base App and EVM wallet login
- Base network detection and switch prompt
- Rock Paper Scissors collision mechanics
- Strategic tile selection with leaderboards
- Optional NFT badge claiming on Base
- Mobile-first Vite frontend
- Railway-ready Express backend
- Standard Web App manifest for Base App submission

## Local Development

### Prerequisites

- Node.js 18 or newer
- npm
- Git
- An EVM wallet configured for Base

### Backend

```bash
cd backend
npm install
npm start
```

Create `backend/.env`:

```env
PORT=3001
BADGE_SIGNER_PK=your_private_key_here_64_chars_hex
```

The backend health check is:

```txt
http://localhost:3001/health
```

Expected response:

```json
{"status":"ok"}
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:

```env
VITE_API_BASE=http://localhost:3001
VITE_BADGE_CONTRACT_ADDRESS=
```

Open:

```txt
http://localhost:5173
```

## Production Deployment

### 1. Deploy Backend

Recommended: Railway.

Use the root `railway.json` if deploying the whole repository:

```json
{
  "buildCommand": "npm --prefix backend install",
  "startCommand": "npm --prefix backend start"
}
```

Set backend environment variables:

```env
PORT=3001
BADGE_SIGNER_PK=your_production_private_key_64_chars_hex
NODE_ENV=production
```

After deploy, verify:

```txt
https://your-backend-domain/health
```

Expected:

```json
{"status":"ok"}
```

### 2. Deploy Frontend

Recommended: Vercel.

Project settings:

- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set frontend environment variables:

```env
VITE_API_BASE=https://your-backend-domain
VITE_BADGE_CONTRACT_ADDRESS=0x... # optional
```

After deploy, verify:

```txt
https://your-frontend-domain/manifest.webmanifest
```

### 3. Optional Badge Contract

If you want on-chain badge claiming:

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

Then put the deployed contract address into:

```env
VITE_BADGE_CONTRACT_ADDRESS=0x...
```

## Base App Submission

Base App uses standard web apps. This repo includes:

- `frontend/public/manifest.webmanifest`
- Base/EVM wallet discovery via EIP-6963
- OpenGraph and Twitter preview metadata
- App assets in `frontend/public/assets/base`

Use these values when registering/submitting:

- Name: `Battle Arena`
- Category: `Games`
- Primary URL: `https://your-frontend-domain`
- Manifest URL: `https://your-frontend-domain/manifest.webmanifest`
- Icon: `https://your-frontend-domain/assets/base/icon.png`
- Preview image: `https://your-frontend-domain/assets/base/og.png`
- Backend health check: `https://your-backend-domain/health`

## Before Publishing

- Confirm `DEV_MODE` is `false` in `frontend/src/App.jsx`
- Confirm `VITE_API_BASE` points to the deployed backend
- Confirm `/health` works on the backend
- Confirm `/manifest.webmanifest` works on the frontend
- Connect with Base App or Coinbase Wallet
- Confirm the wallet switches to Base
- Play a full game round
- Confirm leaderboard requests work
- If badges are enabled, confirm badge claiming on Base

## Useful Commands

```bash
cd frontend
npm run build
```

```bash
cd backend
npm start
```

## API

- `POST /lobby/join`
- `POST /round/rps`
- `POST /round/tile`
- `GET /leaderboard`
- `GET /player/:address/stats`
- `GET /badge/:address`
- `POST /badge/claim`

## Notes

This app is Base-only.
