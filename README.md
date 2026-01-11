# FundTracer by DT

<p align="center">
  <img src="packages/web/public/logo.png" alt="FundTracer Logo" width="200">
</p>

<p align="center">
  <strong>Blockchain Wallet Forensics & Sybil Detection Tool</strong><br>
  Trace funding sources, detect suspicious patterns, and identify coordinated wallet behavior.
</p>

---

## Quick Start

### CLI (Terminal)

```bash
# Clone and install
git clone https://github.com/Deji-Tech/fundtracer-by-dt.git
cd fundtracer-by-dt
npm install

# Build and link CLI globally
cd packages/cli && npm run build && npm link

# Now just type:
fundtracer
```

You'll see a beautiful gradient ASCII banner and an interactive menu:

```
  ███████╗██╗   ██╗███╗   ██╗██████╗ ████████╗██████╗  █████╗  ██████╗███████╗██████╗ 
  ██╔════╝██║   ██║████╗  ██║██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗
  █████╗  ██║   ██║██╔██╗ ██║██║  ██║   ██║   ██████╔╝███████║██║     █████╗  ██████╔╝
  ██╔══╝  ██║   ██║██║╚██╗██║██║  ██║   ██║   ██╔══██╗██╔══██║██║     ██╔══╝  ██╔══██╗
  ██║     ╚██████╔╝██║ ╚████║██████╔╝   ██║   ██║  ██║██║  ██║╚██████╗███████╗██║  ██║
  ╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚═╝  ╚═╝

                              by DT • Blockchain Wallet Forensics Tool
```

### Web Dashboard

```bash
# Terminal 1: Start API server
npm run dev:server

# Terminal 2: Start web app
npm run dev
```

Visit `http://localhost:5173` and sign in with Google.

---

## Features

| Feature | Description |
|---------|-------------|
| **Wallet Analysis** | Deep-dive into any EVM address to trace funding sources and destinations |
| **Sybil Detection** | Compare multiple wallets to find shared funding patterns |
| **Contract Analysis** | Analyze contract interactors for coordinated behavior |
| **Risk Scoring** | Automatic detection of suspicious activity with 0-100 risk score |

## What We Detect

- Rapid fund movement (flash loans, MEV bots)
- Same-block transactions (bot activity)
- Circular fund flows (wash trading)
- Sybil farming patterns (shared funding sources)
- Fresh wallet with unusually high activity
- Dust attacks

---

## Project Structure

```
fundtracer-by-dt/
├── packages/
│   ├── core/      # Analysis engine, providers, detection algorithms
│   ├── web/       # React dashboard with D3 visualizations
│   ├── server/    # Express API with Firebase auth
│   └── cli/       # Terminal tool with ASCII banner
```

## Supported Chains

| Chain | Status |
|-------|--------|
| Ethereum | Supported |
| Linea | Supported |
| Arbitrum | Supported |
| Base | Supported |
| Optimism | Coming Soon |
| Polygon | Coming Soon |

---

## Configuration

### Environment Variables

**Server** (`packages/server/.env`):
```env
DEFAULT_ETHERSCAN_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY="your_key"
```

**Web** (`packages/web/.env`):
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_API_URL=http://localhost:3001
```

### CLI Configuration

```bash
# Set your Etherscan API key
fundtracer config --set-key YOUR_API_KEY

# Verify
fundtracer config --show
```

---

## Usage Limits

- **Free tier**: 7 analyses per day
- **Custom API key**: Unlimited (add your own Etherscan key)

---

## Tech Stack

- **Frontend**: React + Vite + D3.js
- **Backend**: Express + Firebase Admin SDK
- **Auth**: Google Sign-in (Firebase)
- **CLI**: Commander + Inquirer + Chalk
- **Analysis**: Custom TypeScript engine

---

## License

MIT License - Built by **DT Development**
