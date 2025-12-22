# Battle Arena Deployment Guide

## Prerequisites

1. Node.js installed
2. Wallet with ETH on Base (for deployment)
3. Base RPC URL (or use public endpoints)

## Backend Deployment

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```env
PORT=3001
BADGE_SIGNER_PK=your_private_key_for_signing
```

3. Start server:
```bash
npm start
```

## Smart Contract Deployment

1. Navigate to contracts directory:
```bash
cd contracts
npm install
```

2. Create `.env` file:
```env
PRIVATE_KEY=your_deployment_wallet_private_key
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_api_key (optional)
BADGE_BASE_URI=https://your-domain.com/api/badges/
```

3. Deploy contract:
```bash
npm run deploy:base
```

4. Save contract address to frontend `.env`:
```env
VITE_BADGE_CONTRACT_ADDRESS=0x...
```

## Frontend Deployment

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```env
VITE_API_BASE=https://your-backend-url.com
VITE_BADGE_CONTRACT_ADDRESS=0x... (from contract deployment)
```

3. Build:
```bash
npm run build
```

4. Deploy `dist` folder to your hosting (Vercel, Netlify, etc.)

## Farcaster Integration

For Farcaster Mini App:
1. Register your app at https://warpcast.com
2. Set your app URL in Farcaster settings
3. Ensure your app works in iframe context

## Base Network

Users need to:
1. Have Base network added to their wallet
2. Have ETH on Base for gas (minting badges)

The app will automatically prompt users to switch to Base when minting.

## Environment Variables Summary

### Backend (.env):
- `PORT` - Server port
- `BADGE_SIGNER_PK` - Private key for signing badges

### Contracts (.env):
- `PRIVATE_KEY` - Deployment wallet private key
- `BASE_RPC_URL` - Base network RPC URL
- `BASESCAN_API_KEY` - For contract verification
- `BADGE_BASE_URI` - Metadata base URL

### Frontend (.env):
- `VITE_API_BASE` - Backend API URL
- `VITE_BADGE_CONTRACT_ADDRESS` - Deployed contract address

## Cost Estimates

- Contract deployment: ~$1-3 (one-time)
- Badge minting: ~$0.01-0.05 per badge (user pays)
- Backend hosting: Varies by provider
- Frontend hosting: Free on Vercel/Netlify




