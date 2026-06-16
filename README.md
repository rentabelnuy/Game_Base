# ⚔️ Battle Arena

A competitive Rock Paper Scissors battle game with tile selection, collision mechanics, leaderboards, and NFT badges on Base network. Optimized for Farcaster Mini Apps and Base ecosystem.

## 🎮 Features

- **Multiplayer Gameplay**: Battle against bots or real players
- **Tile Selection Strategy**: Choose tiles with different point values
- **Collision Mechanics**: RPS battles when multiple players select the same tile
- **Leaderboard System**: Track best scores, wins, and win rates
- **NFT Badges**: Earn on-chain badges on Base network
- **Farcaster Integration**: Works as a Farcaster Mini App
- **Base Network**: Built for Base ecosystem
- **Mobile Optimized**: Responsive design for mobile devices

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (for cloning)

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd battle-arena
```

### Step 2: Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### Step 3: Configure Environment Variables

#### Backend Configuration

Create `backend/.env` file:
```env
PORT=3001
BADGE_SIGNER_PK=your_private_key_here_64_chars_hex
```

**Generate a secure key:**
```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[System.Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### Frontend Configuration

Create `frontend/.env` file:
```env
VITE_API_BASE=http://localhost:3001
VITE_BADGE_CONTRACT_ADDRESS=
```

**Note**: Leave `VITE_BADGE_CONTRACT_ADDRESS` empty for local testing.

### Step 4: Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm start
```

You should see: `Server running on port 3001`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

You should see: `Local: http://localhost:5173/`

### Step 5: Open in Browser

Navigate to: `http://localhost:5173`

## 🏭 Production Deployment Guide

### Overview

This guide covers deploying Battle Arena to production for:
- **Farcaster Mini App** (Warpcast)
- **Base App** (Base ecosystem)

### Prerequisites for Production

1. **Domain name** (e.g., `battle-arena.xyz`)
2. **Hosting accounts**:
   - Backend: Railway, Render, or similar
   - Frontend: Vercel, Netlify, or Cloudflare Pages
3. **Base network wallet** with ETH for contract deployment
4. **Farcaster account** (for Mini App registration)

---

## 📋 Step-by-Step Production Deployment

### Part 1: Deploy Backend API

#### Option A: Railway (Recommended)

1. **Sign up** at [railway.app](https://railway.app)

2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or upload code)

3. **Configure environment variables**:
   ```
   PORT=3001
   BADGE_SIGNER_PK=your_production_private_key_64_chars
   ```

4. **Deploy**:
   - Railway auto-detects Node.js
   - Add start command: `npm start`
   - Deploy!

5. **Get your backend URL**:
   - Railway provides: `https://your-app.up.railway.app`
   - Copy this URL for frontend config

#### Option B: Render

1. **Sign up** at [render.com](https://render.com)

2. **Create Web Service**:
   - Connect GitHub repo
   - Select `backend` folder
   - Build command: `npm install`
   - Start command: `npm start`

3. **Set environment variables**:
   ```
   PORT=3001
   BADGE_SIGNER_PK=your_production_private_key
   ```

4. **Deploy** and get URL: `https://your-app.onrender.com`

---

### Part 2: Deploy Smart Contract (Optional - for Badges)

If you want NFT badge functionality:

1. **Navigate to contracts**:
   ```bash
   cd contracts
   npm install
   ```

2. **Create `.env` file**:
   ```env
   PRIVATE_KEY=your_deployment_wallet_private_key
   BASE_RPC_URL=https://mainnet.base.org
   BASESCAN_API_KEY=your_api_key (optional)
   BADGE_BASE_URI=https://your-domain.com/api/badges/
   ```

3. **Deploy contract**:
   ```bash
   npm run deploy:base
   ```

4. **Save contract address** - You'll need this for frontend config

---

### Part 3: Deploy Frontend

#### Option A: Vercel (Recommended for Farcaster)

1. **Sign up** at [vercel.com](https://vercel.com)

2. **Import project**:
   - Connect GitHub repo
   - Select `frontend` folder
   - Framework preset: Vite

3. **Configure environment variables**:
   ```
   VITE_API_BASE=https://your-backend-url.com
   VITE_BADGE_CONTRACT_ADDRESS=0x... (if deployed)
   ```

4. **Deploy**:
   - Vercel auto-builds and deploys
   - Get URL: `https://your-app.vercel.app`

5. **Custom domain** (optional):
   - Add your domain in Vercel settings
   - Update DNS records

#### Option B: Netlify

1. **Sign up** at [netlify.com](https://netlify.com)

2. **New site from Git**:
   - Connect GitHub repo
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment variables**:
   ```
   VITE_API_BASE=https://your-backend-url.com
   VITE_BADGE_CONTRACT_ADDRESS=0x...
   ```

4. **Deploy** and get URL: `https://your-app.netlify.app`

#### Option C: Cloudflare Pages

1. **Sign up** at [cloudflare.com](https://cloudflare.com)

2. **Create Pages project**:
   - Connect GitHub repo
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Environment variables** (in Cloudflare dashboard)

4. **Deploy** and get URL: `https://your-app.pages.dev`

---

### Part 4: Configure Farcaster Mini App

1. **Register your Mini App**:
   - Go to [Warpcast Developer Portal](https://warpcast.com/~/developers)
   - Or contact Farcaster team for Mini App access

2. **Configure Mini App settings**:
   - **App Name**: Battle Arena
   - **App URL**: `https://your-frontend-url.com`
   - **Icon**: Upload app icon (512x512px recommended)
   - **Description**: "Competitive RPS battle game on Base"

3. **Test in Warpcast**:
   - Open Warpcast app
   - Search for your Mini App
   - Test functionality

4. **Farcaster-specific considerations**:
   - Ensure your app works in iframe context
   - Test mobile responsiveness
   - Verify wallet connection works in Farcaster context

5. **Manifest file in this repo**:
   - File: `frontend/public/.well-known/farcaster.json`
   - Required: replace `accountAssociation.header/payload/signature` with values generated in the Farcaster Developer Portal
   - If your domain changes, update every `https://...vercel.app` URL in the manifest to your final frontend domain

---

### Part 5: Configure Base App Integration

Base App now treats apps as standard web apps, so this project includes:
- Web App Manifest: `frontend/public/manifest.webmanifest`
- Base-friendly metadata in `frontend/index.html`
- EIP-6963 wallet-provider discovery for embedded wallets

To submit/register:
1. Deploy frontend to Vercel and backend to Render/Fly/Railway.
2. Confirm `https://your-frontend-domain/manifest.webmanifest` loads.
3. Confirm `https://your-backend-domain/health` returns `{"status":"ok"}`.
4. Register your app on Base.dev with:
   - Name: Battle Arena
   - Category: Games
   - Primary URL: your frontend URL
   - Icon: `/assets/miniapp/icon.png`
   - Preview/Hero/Screenshot: `/assets/miniapp/og.png`


1. **Base App Store** (if applicable):
   - Submit to Base App Store
   - Provide app metadata
   - Link to your deployed frontend

2. **Base Network Configuration**:
   - Ensure frontend prompts users to switch to Base network
   - Test wallet connections (MetaMask, Coinbase Wallet, etc.)
   - Verify badge minting works on Base mainnet

3. **Base Ecosystem Integration**:
   - Add Base branding
   - Link to Base documentation
   - Consider Base grants/partnerships

---

### Part 6: Disable Development Mode

1. **Update frontend**:
   ```javascript
   // frontend/src/App.jsx
   const DEV_MODE = false; // Change from true to false
   ```

2. **Rebuild and redeploy frontend**:
   ```bash
   cd frontend
   npm run build
   # Deploy dist folder to your hosting
   ```

3. **Test wallet connections**:
   - Test with MetaMask
   - Test with Coinbase Wallet
   - Test in Farcaster context

---

## 🔒 Security Checklist

Before going live:

- [ ] **Environment variables** are set in hosting platform (not in code)
- [ ] **Private keys** are secure and never committed to Git
- [ ] **CORS** is configured correctly (only allow your frontend domain)
- [ ] **Rate limiting** is enabled on backend
- [ ] **HTTPS** is enabled (most hosting platforms do this automatically)
- [ ] **DEV_MODE** is set to `false` in production
- [ ] **API endpoints** are protected
- [ ] **Error messages** don't expose sensitive information

---

## 🌐 Environment Variables Summary

### Backend Production (.env)
```env
PORT=3001
BADGE_SIGNER_PK=your_production_private_key_64_chars_hex
NODE_ENV=production
```

### Frontend Production (.env)
```env
VITE_API_BASE=https://your-backend-url.com
VITE_BADGE_CONTRACT_ADDRESS=0x... (if badges enabled)
```

---

## 📱 Testing Production Deployment

### Test Checklist

- [ ] Backend API is accessible
- [ ] Frontend loads correctly
- [ ] Wallet connection works
- [ ] Game mechanics function properly
- [ ] Leaderboard updates
- [ ] Badge minting works (if enabled)
- [ ] Mobile responsive design
- [ ] Farcaster Mini App loads in Warpcast
- [ ] Base network switching works
- [ ] Share features work

---

## 🐛 Troubleshooting Production Issues

### Backend Issues

**Problem**: API not accessible
- Check environment variables are set
- Verify CORS allows your frontend domain
- Check hosting platform logs

**Problem**: Rate limiting too strict
- Adjust rate limit settings in `backend/index.js`

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `VITE_API_BASE` is correct
- Check CORS settings on backend
- Test API endpoint directly in browser

**Problem**: Wallet not connecting
- Ensure `DEV_MODE = false`
- Check browser console for errors
- Verify Base network is added to wallet

### Farcaster Issues

**Problem**: Mini App not loading
- Check iframe compatibility
- Verify URL is correct in Farcaster settings
- Test in Warpcast app directly

---

## 📚 Additional Documentation

- `DEPLOYMENT.md` - Detailed deployment guide
- `REFACTORING_GUIDE.md` - Code improvement recommendations
- `UPGRADE_PRIORITY.md` - Upgrade priority guide
- `CLEANUP_SUMMARY.md` - Code cleanup summary
- `contracts/README.md` - Smart contract documentation

---

## 🎯 Quick Reference

### Local Development
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

### Production Build
```bash
# Frontend
cd frontend && npm run build
# Deploy dist/ folder
```

### API Endpoints
- `POST /lobby/join` - Join a game
- `POST /round/rps` - Submit RPS choice
- `POST /round/tile` - Submit tile selection
- `GET /leaderboard` - Get leaderboard
- `GET /player/:address/stats` - Get player stats
- `GET /badge/:address` - Get player badges

---

## 💡 Tips

- **Start with backend deployment** - Get API working first
- **Test locally with production URLs** - Use production backend URL in local frontend
- **Use staging environment** - Test before going fully live
- **Monitor logs** - Check hosting platform logs for errors
- **Set up error tracking** - Consider Sentry or similar

---

## 🆘 Need Help?

1. Check hosting platform documentation
2. Review error logs in hosting dashboard
3. Test API endpoints directly
4. Verify environment variables are set
5. Check browser console for frontend errors

---

**Built for Farcaster & Base** 🎭🔵

**Happy Deploying! 🚀**
