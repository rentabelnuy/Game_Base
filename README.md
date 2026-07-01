# Battle Arena

Battle Arena is a mobile-first strategy game built for Base. Players connect a Base-compatible wallet, choose a Rock/Paper/Scissors weapon, compete for high-value tiles, climb the leaderboard, and can mint earned achievement badges on Base.

Live app:

```txt
https://game-base-md2u.vercel.app
```

## Highlights

- Base-only web app, prepared for Base App submission
- Wallet support through injected EVM wallets, WalletConnect, and Base Account
- Rock/Paper/Scissors collision mechanics
- Tile-selection rounds with bot opponents
- Leaderboard and player stats API
- ERC-1155 badge contract with backend EIP-712 mint authorization
- Vite + React frontend
- Express backend ready for Railway
- Hardhat contract workspace for Base and Base Sepolia

## Project Structure

```txt
backend/     Express API, game rounds, leaderboard, badge authorization
frontend/    React/Vite app, wallet connection, game UI, badge minting
contracts/   Hardhat project and ERC-1155 badge contract
```

## Local Development

### Backend

```bash
cd backend
npm install
npm start
```

Create `backend/.env` from `backend/.env.example`:

```env
PORT=3001
RATE_LIMIT=40
BADGE_SIGNER_PK=
BADGE_CONTRACT_ADDRESS=
BADGE_CHAIN_ID=8453
```

Health check:

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

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE=http://localhost:3001
VITE_BADGE_CONTRACT_ADDRESS=
VITE_WALLETCONNECT_PROJECT_ID=
```

Open:

```txt
http://localhost:5173
```

### Contracts

```bash
cd contracts
npm install
npm run compile
```

See [contracts/README.md](contracts/README.md) for Base Sepolia and Base mainnet deployment steps.

## Production Deployment

### Backend: Railway

Use the root `railway.json` if deploying from the repository root.

Required variables:

```env
PORT=3001
NODE_ENV=production
BADGE_SIGNER_PK=backend_signer_private_key
BADGE_CONTRACT_ADDRESS=deployed_badge_contract_address
BADGE_CHAIN_ID=8453
```

Verify after deploy:

```txt
https://your-backend-domain/health
```

### Frontend: Vercel

Project settings:

- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Required variables:

```env
VITE_API_BASE=https://your-backend-domain
VITE_BADGE_CONTRACT_ADDRESS=deployed_badge_contract_address
VITE_WALLETCONNECT_PROJECT_ID=walletconnect_project_id
```

## Base App Submission

This app uses the standard web app model for Base App.

Included:

- Web app manifest: `frontend/public/manifest.webmanifest`
- Base verification meta tag in `frontend/index.html`
- App icon and preview assets in `frontend/public/assets/base`
- WalletConnect and Base Account support for mobile wallet flows

Suggested submission values:

- Name: `Battle Arena`
- Category: `Games`
- Primary URL: `https://game-base-md2u.vercel.app`
- Manifest URL: `https://game-base-md2u.vercel.app/manifest.webmanifest`
- Icon: `https://game-base-md2u.vercel.app/assets/base/icon.png`
- Preview image: `https://game-base-md2u.vercel.app/assets/base/og.png`

## Badge Contract

The badge contract is an ERC-1155 contract deployed from the Hardhat workspace. Minting is protected by EIP-712 signatures from the backend signer, so users can only mint badges they earned in the game.

Current Base mainnet contract used during setup:

```txt
0x7f573970E7218D7503139b913674651A489953Ff
```

Keep production addresses in hosting environment variables. Do not commit private keys or `.env` files.

## API

- `GET /health`
- `POST /lobby/join`
- `POST /round/rps`
- `POST /round/tile`
- `GET /leaderboard`
- `GET /player/:address/stats`
- `GET /badge/:address`
- `POST /badge/claim`

## Security Notes

- Real `.env` files are ignored by Git.
- Do not commit private keys, seed phrases, API keys, or deployment secrets.
- Use a separate backend signer wallet for badge authorization.
- Rotate any key that has ever been shared in chat, screenshots, logs, or public issues.

## License

MIT
