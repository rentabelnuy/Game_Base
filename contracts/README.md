# Battle Arena Badge Contract

ERC-1155 NFT contract for Battle Arena game badges deployed on Base network.

## Setup

1. Install dependencies:
```bash
cd contracts
npm install
```

2. Create `.env` file:
```env
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_basescan_api_key (optional, for verification)
BADGE_BASE_URI=https://your-domain.com/api/badges/
```

## Deployment

### Deploy to Base Mainnet:
```bash
npm run deploy:base
```

### Deploy to Base Sepolia (testnet):
```bash
npm run deploy:baseSepolia
```

After deployment, save the contract address to your frontend `.env`:
```env
VITE_BADGE_CONTRACT_ADDRESS=0x...
```

## Contract Functions

### Public Functions (Users call these):
- `mintBadge(uint256 badgeId)` - Mint a single badge
- `mintBadges(uint256[] badgeIds)` - Batch mint multiple badges
- `hasUserMinted(address user, uint256 badgeId)` - Check if user minted a badge
- `getUserBadges(address user)` - Get all badges minted by user
- `getBadgeInfo(uint256 badgeId)` - Get badge information

### Owner Functions:
- `registerBadge(uint256, string, string, uint256)` - Register new badge type
- `setBaseURI(string)` - Update metadata URI

## Badge IDs

1. Rookie Fighter (5+ points)
2. Skilled Fighter (25+ points)
3. Battle Champion (100+ points)
4. Legendary Warrior (200+ points)
5. First Victory
6. Hot Streak
7. Survivor
8. Veteran

## Gas Costs

- Deployment: ~$1-3 (one-time)
- Mint per badge: ~$0.01-0.05 (user pays)

## Verification

After deployment:
```bash
npm run verify
```

## Frontend Integration

Set `VITE_BADGE_CONTRACT_ADDRESS` in your frontend `.env` file to enable badge minting functionality.




