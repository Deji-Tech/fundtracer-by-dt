# FundTracer Deployment & Subscription Updates

## ✅ Completed Changes

### 1. Chain Availability
- **Only Linea is now active** - All other chains (Ethereum, Arbitrum, Base, Optimism, Polygon) show "soon"
- Users can only analyze wallets on Linea Mainnet for now

### 2. Removed Colorful Upgrade Button
- Deleted the gradient "Upgrade to Premium" button from AuthPanel
- Removed inline pricing display completely

### 3. New Clean Payment Modal
- Created a professional payment modal with:
  - Two tier options: **PRO ($10 USDT)** and **MAX ($17 USDT)**
  - Payment address on Linea Mainnet with copy-to-clipboard
  - Clear instructions for payment
  - Warning about network compatibility 
  - Auto-upgrades within 2 minutes

### 4. Onboarding Flow
- Removed pricing step from onboarding (was Step 4)
- Onboarding now only shows:
  1. Welcome
  2. How To Use
  3. Privacy
- Full-screen overlay design maintained

### 5. Header Upgrade Button
- The "Upgrade" button next to the Message button now opens the **Payment Modal** directly
- No more intermediate pricing pages

## 🔧 Subscription Consistency (Web ↔️ Terminal)

### Current Architecture
**Web App:**
- Uses Firebase Authentication (wallet signature)
- User profile stored in Firestore with `tier` field
- Payment listener monitors Linea blockchain for USDT transfers
- Automatically upgrades tier when payment detected

**Terminal/CLI:**
- Uses local API key configuration (`.fundtracer` config file)
- No authentication system currently
- Direct API calls to Alchemy/Moralis/Dune

### How to Make Subscriptions Consistent

The CLI would need to be updated to:

1. **Add Firebase Authentication to CLI**
   ```typescript
   // packages/cli/src/auth.ts
   import { initializeApp } from 'firebase/app';
   import { getAuth, signInWithCustomToken } from 'firebase/auth';
   
   // Store auth token locally after web login
   // Read from ~/.fundtracer/auth.json
   ```

2. **Sync Tier from Server**
   ```typescript
   // Before each analysis, check user tier
   const userProfile = await getUserProfile(authToken);
   if (userProfile.tier === 'free') {
     // Show upgrade prompt or limit features
   }
   ```

3. **Share Session Between Web and CLI**
   - User logs in on web → generates auth token
   - CLI reads token from shared location
   - Both use same Firebase backend

### Recommended Approach (Simple)

For now, the easiest approach is:

1. **Manual Tier Check in CLI:**
   - User enters their wallet address when setting up CLI
   - CLI calls `/api/user/profile` to fetch tier
   - Cache tier locally for 24 hours

2. **Implementation:**
   ```bash
   # User setup
   fundtracer config --set-wallet 0x...
   
   # CLI checks tier on each run
   # If expired or free tier, shows payment modal address
   ```

3. **Payment Flow:**
   - User pays on web OR gets payment address in terminal
   - Both update the same Firebase profile by wallet address
   - CLI refreshes tier on next analysis

### Current Status
- ✅ Web payment system works (Linea USDT → Firebase update)
- ⚠️ CLI does not check tier (runs unlimited for now)
- 📋 TODO: Add tier check to CLI before analysis

## 📝 Next Steps

If you want consistent subscriptions:

1. Add wallet address to CLI config
2. Add tier check before analysis in CLI
3. Show upgrade instructions if free tier
4. Both web and CLI read from same Firebase profile

Would you like me to implement this CLI tier checking now?
