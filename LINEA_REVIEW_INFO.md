FundTracer - Linea App Review Guide

App Name: FundTracer
URL: https://fundtracer.xyz
Network: Linea Mainnet

Application Overview
FundTracer is a visual platform for tracking funds and detecting Sybil activity. We use graph visualization to help users follow money trails and identify suspicious patterns.

How to Test

1. Connect & Authentication
Click "Connect Wallet" at the top right. Make sure your wallet is on Linea Mainnet. You will need to sign a message to verify your session.

2. Free Tier Verification (On-Chain)
To verify real users, we require a one-time transaction on Linea. 
- Try to analyze a wallet address (e.g. use the "Demo" button).
- You will see a prompt to verify your session.
- Sign the 0 ETH transaction to our verification address. 
- We use Linea for this step because of its speed and low transaction costs.

3. Analyze a Wallet
Enter a wallet address and select "Ethereum" or "Linea". The app generates a graph showing fund flows and calculates a risk score.

4. Premium Upgrade
Click the "Upgrade" or "Pro" badge. This opens the payment modal where users can upgrade by sending USDT on Linea Mainnet. Our system monitors the chain to automatically activate the tier.

Test Accounts
The app uses Web3 login, so you don't need a username or password. 
- Free Tier: Limited to 7 analyses per day.
- Pro Tier: 25 analyses per day.

Tech Stack & Linea Integration
Frontend: React, Vite, D3.js
Backend: Node.js, Express, Firebase

Linea Integration Highlights:
- Access Control: We check for on-chain activity on Linea to verify users.
- Payments: Subscriptions are handled via native USDT transfers on Linea.
- Analysis: The core tool pulls and visualizes transaction data from Linea.
